from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import Member, Dependant, Contribution, Provider, Claim, FraudAlert, Notification
from .serializers import (
    MemberSerializer, MemberListSerializer, DependantSerializer,
    ContributionSerializer, ProviderSerializer, ClaimSerializer,
    FraudAlertSerializer, NotificationSerializer, DashboardStatsSerializer,
)


# ─── Dashboard ────────────────────────────────────────────────────────────────

@api_view(['GET'])
def dashboard_stats(request):
    """Return aggregate stats for the SHA dashboard."""
    total_contributions = Contribution.objects.filter(
        status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    stats = {
        'total_members': Member.objects.count(),
        'active_members': Member.objects.filter(status='active').count(),
        'total_contributions_kes': total_contributions,
        'total_claims': Claim.objects.count(),
        'pending_claims': Claim.objects.filter(status__in=['submitted', 'under_review']).count(),
        'approved_claims': Claim.objects.filter(status='approved').count(),
        'total_providers': Provider.objects.count(),
        'accredited_providers': Provider.objects.filter(is_accredited=True).count(),
        'open_fraud_alerts': FraudAlert.objects.filter(status='open').count(),
        'critical_alerts': FraudAlert.objects.filter(status='open', severity='critical').count(),
    }

    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


# ─── Members ──────────────────────────────────────────────────────────────────

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().prefetch_related('dependants', 'contributions', 'claims')

    def get_serializer_class(self):
        if self.action == 'list':
            return MemberListSerializer
        return MemberSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')
        county = self.request.query_params.get('county')

        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(sha_number__icontains=search) |
                Q(national_id__icontains=search) |
                Q(phone_number__icontains=search)
            )
        if status_filter:
            qs = qs.filter(status=status_filter)
        if county:
            qs = qs.filter(county__icontains=county)

        return qs

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Manually verify and activate a member."""
        member = self.get_object()
        member.status = 'active'
        member.save()
        return Response({'message': f'{member.full_name} verified and activated.'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a member account."""
        member = self.get_object()
        member.status = 'suspended'
        member.save()
        return Response({'message': f'{member.full_name} account suspended.'})

    @action(detail=True, methods=['get'])
    def eligibility(self, request, pk=None):
        """Check if member is eligible for benefits."""
        member = self.get_object()
        recent_contributions = member.contributions.filter(
            status='confirmed'
        ).order_by('-payment_period')[:3]

        is_eligible = member.status == 'active' and recent_contributions.exists()
        return Response({
            'sha_number': member.sha_number,
            'member_name': member.full_name,
            'status': member.status,
            'is_eligible': is_eligible,
            'recent_contributions_count': recent_contributions.count(),
        })


# ─── Dependants ───────────────────────────────────────────────────────────────

class DependantViewSet(viewsets.ModelViewSet):
    queryset = Dependant.objects.all().select_related('member')
    serializer_class = DependantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs


# ─── Contributions ────────────────────────────────────────────────────────────

class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all().select_related('member')
    serializer_class = ContributionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        status_filter = self.request.query_params.get('status')
        method = self.request.query_params.get('method')

        if member_id:
            qs = qs.filter(member_id=member_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if method:
            qs = qs.filter(payment_method=method)

        return qs

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending contribution."""
        contribution = self.get_object()
        if contribution.status != 'pending':
            return Response(
                {'error': 'Only pending contributions can be confirmed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        contribution.status = 'confirmed'
        contribution.paid_at = timezone.now()
        contribution.save()
        return Response({'message': 'Contribution confirmed successfully.'})


# ─── Providers ────────────────────────────────────────────────────────────────

class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        county = self.request.query_params.get('county')
        accredited = self.request.query_params.get('accredited')
        level = self.request.query_params.get('level')

        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(provider_code__icontains=search))
        if county:
            qs = qs.filter(county__icontains=county)
        if accredited is not None:
            qs = qs.filter(is_accredited=(accredited.lower() == 'true'))
        if level:
            qs = qs.filter(level=level)

        return qs

    @action(detail=True, methods=['post'])
    def accredit(self, request, pk=None):
        """Accredit a provider."""
        provider = self.get_object()
        provider.is_accredited = True
        provider.accreditation_date = timezone.now().date()
        provider.save()
        return Response({'message': f'{provider.name} accredited successfully.'})


# ─── Claims ───────────────────────────────────────────────────────────────────

class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.all().select_related('member', 'provider')
    serializer_class = ClaimSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        provider_id = self.request.query_params.get('provider')
        status_filter = self.request.query_params.get('status')
        flagged = self.request.query_params.get('flagged')

        if member_id:
            qs = qs.filter(member_id=member_id)
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if flagged is not None:
            qs = qs.filter(is_flagged=(flagged.lower() == 'true'))

        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a claim with optional approved amount."""
        claim = self.get_object()
        approved_amount = request.data.get('approved_amount', claim.claimed_amount)
        notes = request.data.get('notes', '')

        claim.status = 'approved'
        claim.approved_amount = approved_amount
        claim.reviewer_notes = notes
        claim.reviewed_at = timezone.now()
        claim.save()
        return Response({'message': f'Claim {claim.claim_number} approved for KES {approved_amount}.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a claim with reason."""
        claim = self.get_object()
        notes = request.data.get('notes', 'Claim rejected.')
        claim.status = 'rejected'
        claim.reviewer_notes = notes
        claim.reviewed_at = timezone.now()
        claim.save()
        return Response({'message': f'Claim {claim.claim_number} rejected.'})

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag a claim for fraud investigation."""
        claim = self.get_object()
        claim.is_flagged = True
        claim.save()

        # Create fraud alert
        FraudAlert.objects.create(
            claim=claim,
            member=claim.member,
            provider=claim.provider,
            alert_type='Manual Flag',
            description=request.data.get('reason', 'Flagged by reviewer for investigation.'),
            severity=request.data.get('severity', 'medium'),
        )
        return Response({'message': f'Claim {claim.claim_number} flagged for fraud review.'})


# ─── Fraud Alerts ─────────────────────────────────────────────────────────────

class FraudAlertViewSet(viewsets.ModelViewSet):
    queryset = FraudAlert.objects.all().select_related('claim', 'member', 'provider')
    serializer_class = FraudAlertSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        severity = self.request.query_params.get('severity')
        alert_status = self.request.query_params.get('status')

        if severity:
            qs = qs.filter(severity=severity)
        if alert_status:
            qs = qs.filter(status=alert_status)

        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark fraud alert as resolved."""
        alert = self.get_object()
        resolution = request.data.get('resolution', 'resolved')
        alert.status = resolution
        alert.resolved_at = timezone.now()
        alert.save()
        return Response({'message': f'Alert marked as {resolution}.'})


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().select_related('member')
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        notif_status = self.request.query_params.get('status')

        if member_id:
            qs = qs.filter(member_id=member_id)
        if notif_status:
            qs = qs.filter(status=notif_status)

        return qs