// Tipos da tela de pagamentos de assinatura.
export interface CouponInfo {
  coupon_id: string;
  coupon_code: string;
  coupon_name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_applied: number;
  original_price: number;
}

export interface Invoice {
  id: string;
  store_id: string;
  plan_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  notes: string | null;
  approved_at: string | null;
  stores: {
    name: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
  plans: {
    name: string;
    price: number;
  };
  coupon_info?: CouponInfo | null;
}

export interface Store {
  id: string;
  name: string;
  custom_monthly_price: number | null;
  discount_reason: string | null;
  plan_id: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
}

export interface PaymentApproval {
  id: string;
  user_id: string;
  store_id: string;
  plan_id: string;
  status: string;
  payment_amount: number;
  payment_proof_url: string | null;
  company_name: string;
  company_document: string;
  phone: string;
  address: any;
  created_at: string;
  rejection_reason: string | null;
  referred_by_salesperson_id: string | null;
  pix_txid?: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  plans?: {
    name: string;
  };
  salesperson?: {
    full_name: string;
    referral_code: string;
  };
}

