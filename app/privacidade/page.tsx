import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da plataforma Dr. Marcelo Psiquiatra. Saiba como coletamos, utilizamos e protegemos seus dados pessoais.",
};

const sections = [
  {
    id: "introducao",
    title: "1. Introdução",
    paragraphs: [
      `A presente Política de Privacidade descreve como a plataforma **Dr. Marcelo Psiquiatra** ("Plataforma", "Nós") coleta, utiliza, armazena e protege as informações pessoais dos usuários ("Você", "Usuário").`,
      `Esta Política está em conformidade com a **Lei Geral de Proteção de Dados Pessoais** (LGPD — Lei nº 13.709/2018) e demais legislações brasileiras aplicáveis. Ao utilizar a Plataforma, você consente com as práticas descritas neste documento.`,
    ],
  },
  {
    id: "dados-coletados",
    title: "2. Dados que Coletamos",
    paragraphs: [
      `**2.1 Dados fornecidos diretamente por você:**`,
      `- **Nome completo** — fornecido no cadastro para identificação na plataforma.
- **Endereço de e-mail** — utilizado para login, comunicações e recuperação de senha.
- **Senha** — armazenada de forma criptografada (hash), nunca em texto puro.`,
      `**2.2 Dados coletados automaticamente:**`,
      `- **Dados de navegação** — páginas visitadas, tempo de permanência, cliques e interações na Plataforma.
- **Progresso de aprendizado** — aulas assistidas, porcentagem de conclusão, pontuação em quizzes, XP acumulado e badges conquistados.
- **Dados do dispositivo** — tipo de navegador, sistema operacional, resolução de tela e tipo de dispositivo (desktop, tablet, celular).
- **Cookies e tecnologias similares** — utilizados para manter sua sessão ativa, lembrar preferências e analisar o uso da Plataforma.`,
      `**2.3 Dados de pagamento:**`,
      `- As informações de pagamento por cartão de crédito são processadas diretamente pelo provedor de pagamento e **não são armazenadas** em nossos servidores.
- Armazenamos apenas o registro de transações (data, valor, status) para controle de assinatura e emissão de comprovantes.`,
    ],
  },
  {
    id: "finalidade",
    title: "3. Finalidade do Uso dos Dados",
    paragraphs: [
      `Utilizamos seus dados pessoais para as seguintes finalidades:`,
      `- **Prestação do serviço** — criar e manter sua conta, autenticar acessos e personalizar a experiência de aprendizado.
- **Progresso e gamificação** — rastrear seu progresso nas aulas, registrar pontuações de quizzes, calcular XP e desbloquear badges e conquistas.
- **Comunicação** — enviar e-mails sobre atualizações da conta, novos conteúdos, alterações nos Termos ou Política de Privacidade.
- **Pagamentos** — processar assinaturas, renovações e cancelamentos do Plano Mensal (R$ 15,00/mês).
- **Melhoria da Plataforma** — analisar padrões de uso para aprimorar conteúdos, interface e funcionalidades.
- **Segurança** — detectar e prevenir fraudes, acessos não autorizados e atividades maliciosas.
- **Obrigações legais** — cumprir exigências legais e regulatórias aplicáveis.`,
    ],
  },
  {
    id: "base-legal",
    title: "4. Base Legal para o Tratamento",
    paragraphs: [
      `Conforme a LGPD, o tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais:`,
      `- **Execução de contrato** (Art. 7º, V) — para a prestação dos serviços contratados ao criar sua conta e/ou assinar o Plano Mensal.
- **Consentimento** (Art. 7º, I) — para o envio de comunicações de marketing e conteúdos promocionais.
- **Legítimo interesse** (Art. 7º, IX) — para melhorias na Plataforma e análises de uso agregadas.
- **Cumprimento de obrigação legal** (Art. 7º, II) — para manter registros conforme exigido pela legislação fiscal e consumerista.`,
    ],
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento de Dados",
    paragraphs: [
      `**Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.**`,
      `Seus dados poderão ser compartilhados apenas nas seguintes situações:`,
      `- **Provedores de pagamento** — para processar transações financeiras de forma segura.
- **Serviços de hospedagem e infraestrutura** — para armazenamento e entrega do conteúdo da Plataforma (ex: Vercel, serviços de cloud).
- **Serviços de autenticação** — para cadastro, login, confirmação de e-mail e recuperação de senha.
- **Obrigação legal** — quando exigido por lei, ordem judicial ou autoridade competente.
- **Proteção de direitos** — quando necessário para proteger nossos direitos, propriedade ou segurança, ou de terceiros.`,
    ],
  },
  {
    id: "armazenamento",
    title: "6. Armazenamento e Segurança",
    paragraphs: [
      `Adotamos medidas técnicas e organizacionais para proteger seus dados pessoais contra acesso não autorizado, perda, alteração ou destruição:`,
      `- **Criptografia** — senhas são armazenadas com hash criptográfico. Comunicações são protegidas via HTTPS/TLS.
- **Controle de acesso** — apenas pessoal autorizado tem acesso aos dados dos Usuários, com autenticação e permissões restritas.
- **Cookies de sessão** — utilizamos cookies seguros (HttpOnly quando aplicável) para manter sua sessão autenticada.
- **Monitoramento** — monitoramos a Plataforma para detectar e responder a incidentes de segurança.`,
      `Seus dados são armazenados enquanto sua conta estiver ativa ou pelo período necessário para cumprir as finalidades descritas nesta Política e obrigações legais.`,
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies",
    paragraphs: [
      `A Plataforma utiliza cookies para as seguintes finalidades:`,
      `- **Cookies essenciais** — necessários para o funcionamento básico da Plataforma, incluindo autenticação de sessão e identificação de função (role) do Usuário.
- **Cookies de preferência** — armazenam configurações como a opção "Lembrar de mim" no login.
- **Cookies analíticos** — coletam dados agregados de uso para aprimoramento da Plataforma.`,
      `Você pode gerenciar cookies diretamente nas configurações do seu navegador. A desativação de cookies essenciais poderá impedir o funcionamento correto da Plataforma.`,
    ],
  },
  {
    id: "direitos",
    title: "8. Seus Direitos (LGPD)",
    paragraphs: [
      `Em conformidade com a LGPD, você possui os seguintes direitos sobre seus dados pessoais:`,
      `- **Confirmação e acesso** — confirmar a existência de tratamento e acessar seus dados pessoais.
- **Correção** — solicitar a correção de dados incompletos, inexatos ou desatualizados.
- **Anonimização ou bloqueio** — solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.
- **Portabilidade** — solicitar a transferência dos seus dados a outro fornecedor de serviço.
- **Eliminação** — solicitar a exclusão de dados pessoais tratados com base no seu consentimento.
- **Revogação do consentimento** — revogar o consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.
- **Informação** — ser informado sobre entidades com as quais compartilhamos seus dados.
- **Oposição** — opor-se ao tratamento quando realizado com base em hipótese diferente do consentimento, caso haja descumprimento da LGPD.`,
      `Para exercer qualquer desses direitos, entre em contato pelo e-mail **psiquefotmiga@hotmail.com**. Responderemos em até 15 dias úteis.`,
    ],
  },
  {
    id: "menores",
    title: "9. Menores de Idade",
    paragraphs: [
      `A Plataforma não é direcionada a menores de 18 anos. Não coletamos intencionalmente dados pessoais de menores de idade sem o consentimento dos pais ou responsáveis legais.`,
      `Caso tomemos conhecimento de que coletamos dados de um menor sem o devido consentimento, tomaremos medidas para excluir essas informações o mais rápido possível.`,
    ],
  },
  {
    id: "retencao",
    title: "10. Retenção de Dados",
    paragraphs: [
      `Seus dados pessoais serão retidos de acordo com os seguintes critérios:`,
      `- **Dados de conta** — mantidos enquanto a conta estiver ativa. Após exclusão, os dados são removidos em até 30 dias, exceto quando a retenção for exigida por lei.
- **Dados de progresso** — aulas assistidas, quizzes e badges são mantidos enquanto a conta existir.
- **Dados de pagamento** — registros de transações são mantidos por 5 anos para fins fiscais e legais.
- **Dados de navegação** — dados de uso agregados e anonimizados podem ser retidos indefinidamente para fins estatísticos.`,
    ],
  },
  {
    id: "alteracoes",
    title: "11. Alterações nesta Política",
    paragraphs: [
      `Reservamo-nos o direito de atualizar esta Política de Privacidade a qualquer momento. Em caso de alterações significativas:`,
      `- Notificaremos você por e-mail e/ou por aviso na Plataforma.
- A data de "última atualização" será revisada no topo desta página.
- O uso continuado da Plataforma após as alterações constitui aceitação da nova Política.`,
    ],
  },
  {
    id: "contato",
    title: "12. Contato e Encarregado de Dados",
    paragraphs: [
      `Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato:`,
      `- **E-mail:** psiquefotmiga@hotmail.com
- **Tempo de resposta:** até 15 dias úteis para solicitações de direitos LGPD; até 24 horas úteis para dúvidas gerais.`,
      `Caso não esteja satisfeito com nossa resposta, você também pode apresentar reclamação à **Autoridade Nacional de Proteção de Dados (ANPD)**.`,
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <LegalPage
      badge="Privacidade e Dados"
      icon={<Shield size={14} className="text-accent-secondary" />}
      title="Política de Privacidade"
      subtitle="Saiba como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais na plataforma Dr. Marcelo Psiquiatra."
      lastUpdated="25 de abril de 2026"
      sections={sections}
      crossLink={{
        href: "/termos",
        title: "Termos de Uso",
        description:
          "Conheça os termos e condições que regem o uso da Plataforma.",
        label: "Ver Termos de Uso",
      }}
    />
  );
}
