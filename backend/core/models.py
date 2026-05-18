from django.db import models
from django.contrib.auth.models import User
import uuid


# ──────────────────────────────────────────────
# MEMBER MANAGEMENT
# ──────────────────────────────────────────────

class Member(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending Verification'),
    ]

    sha_number = models.CharField(max_length=20, unique=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    national_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    kra_pin = models.CharField(max_length=20, blank=True)
    county = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    registration_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.sha_number:
            self.sha_number = f"SHA{str(uuid.uuid4().int)[:10]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sha_number} - {self.full_name}"

    class Meta:
        ordering = ['-registration_date']


class Dependant(models.Model):
    RELATIONSHIP_CHOICES = [
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='dependants')
    full_name = models.CharField(max_length=200)
    national_id = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField()
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.relationship} of {self.member.full_name})"


# ──────────────────────────────────────────────
# CONTRIBUTIONS
# ──────────────────────────────────────────────

class Contribution(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('bank', 'Bank Transfer'),
        ('payroll', 'Payroll Deduction'),
        ('cash', 'Cash'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=100, unique=True, blank=True)
    payment_period = models.DateField(help_text="Month/Year this contribution covers")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.transaction_reference:
            self.transaction_reference = f"TXN{str(uuid.uuid4().int)[:12]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.sha_number} - KES {self.amount} ({self.status})"

    class Meta:
        ordering = ['-created_at']


# ──────────────────────────────────────────────
# PROVIDER / HOSPITAL MANAGEMENT
# ──────────────────────────────────────────────

class Provider(models.Model):
    FACILITY_TYPE_CHOICES = [
        ('hospital', 'Hospital'),
        ('clinic', 'Clinic'),
        ('pharmacy', 'Pharmacy'),
        ('laboratory', 'Laboratory'),
        ('specialist', 'Specialist Centre'),
    ]

    LEVEL_CHOICES = [
        ('1', 'Level 1 - Community'),
        ('2', 'Level 2 - Dispensary'),
        ('3', 'Level 3 - Health Centre'),
        ('4', 'Level 4 - County Hospital'),
        ('5', 'Level 5 - Regional Referral'),
        ('6', 'Level 6 - National Referral'),
    ]

    provider_code = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPE_CHOICES)
    level = models.CharField(max_length=5, choices=LEVEL_CHOICES)
    county = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    is_accredited = models.BooleanField(default=False)
    accreditation_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.provider_code:
            self.provider_code = f"PRV{str(uuid.uuid4().int)[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.provider_code} - {self.name}"

    class Meta:
        ordering = ['name']


# ──────────────────────────────────────────────
# CLAIMS
# ──────────────────────────────────────────────

class Claim(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('appealed', 'Appealed'),
    ]

    claim_number = models.CharField(max_length=20, unique=True, blank=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='claims')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='claims')
    patient_name = models.CharField(max_length=200)
    admission_date = models.DateField()
    discharge_date = models.DateField(null=True, blank=True)
    diagnosis = models.TextField()
    treatment_description = models.TextField()
    claimed_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False, help_text="Flagged for fraud investigation")

    def save(self, *args, **kwargs):
        if not self.claim_number:
            self.claim_number = f"CLM{str(uuid.uuid4().int)[:10]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.claim_number} - {self.member.sha_number} - KES {self.claimed_amount}"

    class Meta:
        ordering = ['-submitted_at']


# ──────────────────────────────────────────────
# FRAUD ALERTS
# ──────────────────────────────────────────────

class FraudAlert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
    ]

    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='fraud_alerts', null=True, blank=True)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='fraud_alerts', null=True, blank=True)
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='fraud_alerts', null=True, blank=True)
    alert_type = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='low')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.alert_type} - {self.severity} - {self.status}"

    class Meta:
        ordering = ['-detected_at']


# ──────────────────────────────────────────────
# NOTIFICATIONS
# ──────────────────────────────────────────────

class Notification(models.Model):
    TYPE_CHOICES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('system', 'System'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.notification_type} - {self.subject} ({self.status})"

    class Meta:
        ordering = ['-created_at']