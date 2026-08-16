import type { Metadata } from 'next';
import { KeyRound, Leaf, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { adminSignIn, requestClientAccess } from '@/app/acesso/actions';

export const metadata: Metadata = {
  title: 'Acesso protegido | Apuração Assistida XML',
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  credenciais: 'E-mail ou senha administrativa inválidos.',
  'sem-acesso': 'A conta foi identificada, mas não possui assinatura ativa para este webapp.',
  email: 'Informe um e-mail válido.',
  envio: 'Não foi possível enviar o link agora. Tente novamente.',
  callback: 'O link não pôde ser validado. Solicite um novo acesso.',
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; mensagem?: string; retorno?: string }>;
}) {
  const query = await searchParams;
  const returnTo = query.retorno?.startsWith('/') && !query.retorno.startsWith('//')
    ? query.retorno
    : '/';

  return (
    <section className="access-overlay">
      <div className="access-brand-panel">
        <div className="access-brand-lockup">
          <span><Leaf size={25} /></span>
          <div><strong>Consultor do Agro</strong><small>por Diniz Contabilidade</small></div>
        </div>
        <span className="page-eyebrow">Apuração Assistida XML</span>
        <h1>Acesso protegido para clientes e testes administrativos.</h1>
        <p>Os XMLs permanecem na sessão do navegador. A liberação depende de autorização administrativa ou assinatura ativa.</p>
        <div className="access-trust-list">
          <span><ShieldCheck size={18} /> Validação de acesso no servidor</span>
          <span><LockKeyhole size={18} /> Bloqueio automático após cancelamento</span>
        </div>
      </div>

      <div className="access-forms-panel">
        {query.erro && <p className="access-alert error" role="alert">{errors[query.erro] ?? 'Não foi possível entrar.'}</p>}
        {query.mensagem === 'link-enviado' && <p className="access-alert success" role="status">Link enviado. Verifique sua caixa de entrada.</p>}
        {query.mensagem === 'saiu' && <p className="access-alert success" role="status">Sessão encerrada com segurança.</p>}

        <form className="access-form" action={adminSignIn}>
          <KeyRound size={23} />
          <div><span className="page-eyebrow">Testes</span><h2>Administrador</h2></div>
          <label>E-mail administrativo<input type="email" name="email" autoComplete="username" required /></label>
          <label>Senha<input type="password" name="password" autoComplete="current-password" minLength={8} required /></label>
          <input type="hidden" name="returnTo" value={returnTo} />
          <button type="submit">Entrar como administrador</button>
        </form>

        <form className="access-form client-access-form" action={requestClientAccess}>
          <Mail size={23} />
          <div><span className="page-eyebrow">Clientes</span><h2>Assinatura paga</h2></div>
          <p>Use o mesmo e-mail informado na contratação para receber um link temporário.</p>
          <label>E-mail da contratação<input type="email" name="email" autoComplete="email" required /></label>
          <button type="submit">Receber link de acesso</button>
          <a href="https://consultordoagro.com.br/servicos/apuracao-assistida-xml">Ver planos de R$ 97 a R$ 299/mês</a>
        </form>
      </div>
    </section>
  );
}
