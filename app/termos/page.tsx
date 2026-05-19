import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso da plataforma Dr. Marcelo Psiquiatra. Leia antes de utilizar nossos serviços de conteúdo educativo sobre saúde mental.",
};

const sections = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos Termos",
    paragraphs: [
      `Ao acessar, navegar ou utilizar a plataforma **Dr. Marcelo Psiquiatra** ("Plataforma"), você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso ("Termos"). Caso não concorde com alguma disposição, solicitamos que não utilize a Plataforma.`,
      `Estes Termos constituem um contrato vinculante entre você ("Usuário") e a equipe responsável pela Plataforma ("Nós", "Nosso"). Reservamo-nos o direito de atualizar estes Termos a qualquer momento; notificaremos as alterações relevantes por e-mail ou aviso na Plataforma.`,
    ],
  },
  {
    id: "descricao",
    title: "2. Descrição da Plataforma",
    paragraphs: [
      `A Plataforma é um ambiente digital de **conteúdo educativo sobre psiquiatria e saúde mental**, oferecendo:`,
      `- **Videoaulas** — aulas gravadas organizadas por categorias (Doenças, Transtornos e Tratamentos, Curiosidades), com progresso individual rastreado.
- **E-books e materiais em PDF** — guias, resumos e materiais complementares para download.
- **Quizzes interativos** — avaliações de múltipla escolha com feedback e pontuação.
- **Stories diários** — conteúdos curtos publicados pelo Dr. Marcelo com informações rápidas sobre saúde mental.
- **Gamificação** — sistema de XP (pontos de experiência), níveis e badges (conquistas) desbloqueáveis.
- **Perfil pessoal** — área com histórico de progresso, estatísticas de aprendizado e configurações da conta.
- **Blog** — redirecionamento para conteúdo editorial externo em blogmarcelopsiquiatra.com.br.`,
      `**Importante:** Todo o conteúdo disponibilizado possui caráter exclusivamente educativo e informativo. A Plataforma **não substitui** consulta, diagnóstico ou tratamento médico/psiquiátrico profissional.`,
    ],
  },
  {
    id: "conta",
    title: "3. Cadastro e Conta do Usuário",
    paragraphs: [
      `Para utilizar a Plataforma, o Usuário deve criar uma conta fornecendo: nome completo, endereço de e-mail válido e senha.`,
      `**Responsabilidades do Usuário:**
- Fornecer informações verdadeiras, completas e atualizadas.
- Manter a confidencialidade de suas credenciais de acesso (e-mail e senha).
- Notificar imediatamente qualquer uso não autorizado da sua conta.
- A senha deve atender aos requisitos mínimos de segurança: ao menos 8 caracteres, incluindo letra maiúscula, número e caractere especial.`,
      `**Responsabilidades Nossas:**
- Armazenamos senhas de forma criptografada.
- Nunca solicitaremos sua senha por e-mail ou qualquer outro canal.`,
      `Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos.`,
    ],
  },
  {
    id: "assinatura",
    title: "4. Planos e Assinatura",
    paragraphs: [
      `A Plataforma opera sob um modelo freemium:`,
      `**Conteúdo Gratuito:**
- Algumas aulas e materiais são disponibilizados gratuitamente para que o Usuário conheça a Plataforma antes de assinar.`,
      `**Plano Mensal — R$ 15,00/mês:**
- Acesso ilimitado a todas as aulas em vídeo.
- Download de todos os e-books e materiais de apoio em PDF.
- Acesso a todos os quizzes interativos com feedback detalhado.
- Stories diários exclusivos do Dr. Marcelo.
- Sistema completo de gamificação (XP, níveis e badges).
- Novos conteúdos adicionados semanalmente.
- Suporte por e-mail prioritário.
- Cancelamento a qualquer momento, sem multa ou taxa.`,
      `**Pagamento:**
- Realizado mensalmente via cartão de crédito ou PIX.
- A cobrança é feita automaticamente a cada renovação.
- O Usuário pode gerenciar sua assinatura na seção "Assinatura" da Plataforma.`,
      `**Cancelamento:**
- O cancelamento pode ser feito a qualquer momento pela Plataforma.
- O acesso ao conteúdo premium permanece ativo até o final do período já pago.
- Não há reembolso proporcional para períodos parcialmente utilizados.`,
    ],
  },
  {
    id: "propriedade",
    title: "5. Propriedade Intelectual",
    paragraphs: [
      `Todo o conteúdo disponibilizado na Plataforma — incluindo, mas não se limitando a, textos, vídeos, áudios, imagens, ilustrações, e-books, quizzes, design da interface, código-fonte, logotipos e marcas — é protegido pelas leis brasileiras de propriedade intelectual e direitos autorais (Lei nº 9.610/1998).`,
      `**O Usuário NÃO pode:**
- Reproduzir, copiar, distribuir ou compartilhar conteúdo da Plataforma sem autorização prévia e expressa.
- Realizar download de vídeos ou qualquer conteúdo multimídia além dos materiais expressamente oferecidos para download (e-books e PDFs).
- Utilizar o conteúdo para fins comerciais, educacionais externos ou qualquer finalidade não prevista nestes Termos.
- Remover ou alterar marcas d'água, créditos ou avisos de propriedade intelectual.
- Realizar engenharia reversa, descompilar ou desmontar qualquer parte da Plataforma.`,
      `A violação dos direitos de propriedade intelectual poderá resultar em suspensão da conta e medidas legais cabíveis.`,
    ],
  },
  {
    id: "conduta",
    title: "6. Regras de Conduta",
    paragraphs: [
      `Ao utilizar a Plataforma, o Usuário se compromete a:`,
      `- Utilizar a Plataforma de forma ética e de acordo com a legislação brasileira vigente.
- Não tentar acessar áreas restritas, contas de terceiros ou sistemas internos da Plataforma.
- Não utilizar bots, scripts automatizados, crawlers ou qualquer meio para extrair dados da Plataforma.
- Não disseminar vírus, malware ou qualquer código malicioso.
- Não compartilhar credenciais de acesso com terceiros.
- Não utilizar o conteúdo da Plataforma para substituir orientação médica profissional.`,
    ],
  },
  {
    id: "disponibilidade",
    title: "7. Disponibilidade e Suporte",
    paragraphs: [
      `Empenharemo-nos para manter a Plataforma acessível 24 horas por dia, 7 dias por semana, em qualquer dispositivo com navegador moderno e acesso à internet.`,
      `**Ressalvas:**
- Não garantimos disponibilidade ininterrupta. A Plataforma poderá ficar indisponível para manutenção, atualizações ou por motivos de força maior.
- Não nos responsabilizamos por falhas de acesso decorrentes de problemas na conexão do Usuário, incompatibilidade de dispositivos ou navegadores desatualizados.`,
      `**Suporte:**
- O suporte é realizado por e-mail (psiquefotmiga@hotmail.com) com prazo de resposta de até 24 horas úteis.
- Assinantes do Plano Mensal possuem prioridade no atendimento.`,
    ],
  },
  {
    id: "isencao",
    title: "8. Isenção de Responsabilidade Médica",
    paragraphs: [
      `**Este é um ponto fundamental:**`,
      `O conteúdo da Plataforma é **exclusivamente educativo e informativo**, elaborado com rigor científico pelo Dr. Marcelo. Contudo:`,
      `- **Não constitui** aconselhamento médico, diagnóstico ou prescrição de tratamento.
- **Não substitui** a consulta presencial ou remota com profissional de saúde mental qualificado.
- Decisões sobre saúde devem **sempre** ser tomadas com acompanhamento de profissional habilitado.
- Em situação de emergência psiquiátrica, procure o serviço de emergência mais próximo ou ligue para o **CVV: 188**.`,
      `O Usuário reconhece que utiliza o conteúdo por sua própria conta e risco, e que a Plataforma não se responsabiliza por decisões tomadas com base exclusivamente no material disponibilizado.`,
    ],
  },
  {
    id: "limitacao",
    title: "9. Limitação de Responsabilidade",
    paragraphs: [
      `Na máxima extensão permitida pela legislação brasileira:`,
      `- A Plataforma é fornecida "como está" e "conforme disponível".
- Não garantimos que o conteúdo seja isento de erros, embora nos esforcemos para manter a precisão científica.
- Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso da Plataforma.
- Nossa responsabilidade total perante o Usuário, em qualquer circunstância, será limitada ao valor total pago pelo Usuário nos 12 meses anteriores ao evento que originou a reclamação.`,
    ],
  },
  {
    id: "rescisao",
    title: "10. Rescisão",
    paragraphs: [
      `**Pelo Usuário:** O Usuário pode encerrar sua conta a qualquer momento nas configurações de perfil. O encerramento implica perda de acesso ao conteúdo e exclusão dos dados de progresso.`,
      `**Por Nós:** Reservamo-nos o direito de suspender ou encerrar a conta de qualquer Usuário que viole estes Termos, sem aviso prévio e sem direito a reembolso de valores pagos.`,
      `Após o encerramento, os dados do Usuário serão tratados conforme nossa Política de Privacidade.`,
    ],
  },
  {
    id: "legislacao",
    title: "11. Legislação Aplicável",
    paragraphs: [
      `Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil.`,
      `Eventuais disputas serão submetidas ao foro da Comarca do domicílio do Usuário, conforme disposto no Código de Defesa do Consumidor (Lei nº 8.078/1990).`,
    ],
  },
  {
    id: "contato",
    title: "12. Contato",
    paragraphs: [
      `Para dúvidas, sugestões ou reclamações sobre estes Termos de Uso, entre em contato:`,
      `- **E-mail:** psiquefotmiga@hotmail.com
- **Tempo de resposta:** até 24 horas úteis.`,
    ],
  },
];

export default function TermosPage() {
  return (
    <LegalPage
      badge="Documento Legal"
      icon={<Scale size={14} className="text-accent-secondary" />}
      title="Termos de Uso"
      subtitle="Leia atentamente os termos e condições que regem o uso da plataforma Dr. Marcelo Psiquiatra."
      lastUpdated="25 de abril de 2026"
      sections={sections}
      crossLink={{
        href: "/privacidade",
        title: "Política de Privacidade",
        description:
          "Saiba como coletamos, utilizamos e protegemos seus dados pessoais.",
        label: "Ver Política de Privacidade",
      }}
    />
  );
}
