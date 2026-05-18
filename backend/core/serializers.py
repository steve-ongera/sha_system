from rest_framework import serializers
from .models import Member, Dependant, Contribution, Provider, Claim, FraudAlert, Notification


class DependantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dependant
        fields = '__all__'
        read_only_fields = ['created_at']


class MemberSerializer(serializers.ModelSerializer):
    dependants = DependantSerializer(many=True, read_only=True)
    total_contributions = serializers.SerializerMethodField()
    active_claims_count = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ['sha_number', 'registration_date', 'updated_at']

    def get_total_contributions(self, obj):
        confirmed = obj.contributions.filter(status='confirmed')
        return sum(c.amount for c in confirmed)

    def get_active_claims_count(self, obj):
        return obj.claims.exclude(status__in=['paid', 'rejected']).count()


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model = Member
        fields = ['id', 'sha_number', 'full_name', 'national_id', 'phone_number', 'county', 'status', 'registration_date']


class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)

    class Meta:
        model = Contribution
        fields = '__all__'
        read_only_fields = ['transaction_reference', 'created_at']


class ProviderSerializer(serializers.ModelSerializer):
    total_claims = serializers.SerializerMethodField()

    class Meta:
        model = Provider
        fields = '__all__'
        read_only_fields = ['provider_code', 'created_at']

    def get_total_claims(self, obj):
        return obj.claims.count()


class ClaimSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_sha = serializers.CharField(source='member.sha_number', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True)

    class Meta:
        model = Claim
        fields = '__all__'
        read_only_fields = ['claim_number', 'submitted_at']


class FraudAlertSerializer(serializers.ModelSerializer):
    claim_number = serializers.CharField(source='claim.claim_number', read_only=True)
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.name', read_only=True)

    class Meta:
        model = FraudAlert
        fields = '__all__'
        read_only_fields = ['detected_at']


class NotificationSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']


# ─── Dashboard Stats Serializer ───────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_members = serializers.IntegerField()
    active_members = serializers.IntegerField()
    total_contributions_kes = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_claims = serializers.IntegerField()
    pending_claims = serializers.IntegerField()
    approved_claims = serializers.IntegerField()
    total_providers = serializers.IntegerField()
    accredited_providers = serializers.IntegerField()
    open_fraud_alerts = serializers.IntegerField()
    critical_alerts = serializers.IntegerField()