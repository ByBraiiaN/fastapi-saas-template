from src.auth.models import Provider as UserProvider
from src.billing.models import BillingPeriod, PaymentProvider, PaymentStatus, SubscriptionStatus

ENUM_CLASSES = [
    SubscriptionStatus,
    PaymentStatus,
    PaymentProvider,
    BillingPeriod,
    UserProvider,
]


# ENUM_COLUMNS = {
#     "subscription_status": SubscriptionStatus,
#     "payment_status": PaymentStatus,
#     "provider": PaymentProvider,
#     "billing_period": BillingPeriod,
# }