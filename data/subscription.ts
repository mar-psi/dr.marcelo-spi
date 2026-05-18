export interface Plan {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  badge?: string;
}

export interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  status: "pago" | "pendente" | "falhou";
  description: string;
  invoiceUrl?: string;
}

export interface UserSubscription {
  id: string;
  isActive: boolean;
  planName: string;
  startDate: string;
  nextBillingDate: string;
  amount: number;
  status: "ativo" | "cancelado" | "suspenso" | "falhou";
  cancelAtPeriodEnd: boolean;
  provider: string | null;
  paymentMethodLabel: string | null;
  canCancel: boolean;
  canPause: boolean;
  canResume: boolean;
  canUpdatePaymentMethod: boolean;
}

export const PLAN: Plan = {
  id: "plano-mensal",
  name: "Plano Mensal",
  price: 15,
  priceFormatted: "R$\u00a015",
  period: "/mês",
  description:
    "Acesso completo a todo o conteúdo da plataforma. Cancele quando quiser.",
  features: [
    "Acesso ilimitado a todas as aulas",
    "E-books e materiais de apoio em PDF",
    "Quizzes interativos com feedback",
    "Stories diários do Dr. Marcelo",
    "Novos conteúdos toda semana",
    "Gamificação, XP e badges exclusivos",
    "Suporte por email prioritário",
    "Cancele quando quiser, sem multa",
  ],
  highlight: true,
  badge: "Mais popular",
};

export const FAQS = [
  {
    id: "f1",
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Você pode cancelar sua assinatura a qualquer momento, sem taxas ou multas. O acesso continua até o fim do período pago.",
  },
  {
    id: "f2",
    question: "Como funciona o pagamento?",
    answer:
      "O pagamento é realizado mensalmente via cartão de crédito. A cobrança é feita automaticamente todo mês na data de renovação.",
  },
  {
    id: "f3",
    question: "Posso acessar em qualquer dispositivo?",
    answer:
      "Sim! A plataforma funciona em celular, tablet e computador. Basta ter acesso à internet e sua conta cadastrada.",
  },
  {
    id: "f4",
    question: "O conteúdo é atualizado com frequência?",
    answer:
      "Sim! Novos conteúdos são adicionados toda semana — novas aulas, stories diários, quizzes e e-books exclusivos.",
  },
  {
    id: "f5",
    question: "Existe período de teste gratuito?",
    answer:
      "Algumas aulas e materiais são disponibilizados gratuitamente para que você conheça o conteúdo antes de assinar.",
  },
  {
    id: "f6",
    question: "Como entro em contato com o suporte?",
    answer:
      "Você pode enviar um e-mail para psiquefotmiga@hotmail.com. Respondemos em até 24 horas úteis.",
  },
];

export const TESTIMONIALS: Array<{
  id: string;
  name: string;
  role: string;
  avatar?: string;
  text: string;
  rating: number;
}> = [];
