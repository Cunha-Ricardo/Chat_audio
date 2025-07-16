<<<<<<< HEAD
# 🎤 IA por Voz - Voice AI App

Uma aplicação React/Next.js que permite conversar com IA usando sua voz!

## ✨ Funcionalidades

- 🎙️ Gravação de áudio via navegador
- 📝 Transcrição automática com Whisper
- 🤖 Respostas inteligentes com GPT-4
- 🔊 Text-to-Speech para ouvir as respostas
- 📱 Interface responsiva e moderna

## 🚀 Como usar

### 1. Configuração

1. Clone ou baixe este projeto
2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure a variável de ambiente:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione sua chave da OpenAI:
   \`\`\`
   OPENAI_API_KEY=sua_chave_aqui
   \`\`\`

### 2. Executar

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:3000

### 3. Usar a aplicação

1. **Clique no botão circular** para começar a gravar
2. **Fale sua pergunta** (máximo 10 segundos)
3. **Aguarde** a transcrição e resposta da IA
4. **Clique no ícone de som** para ouvir a resposta

## 🔧 Tecnologias

- **Next.js 14** - Framework React
- **AI SDK** - Integração com OpenAI
- **shadcn/ui** - Componentes de interface
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem estática

## 📋 Requisitos

- Node.js 18+
- Navegador moderno com suporte a MediaRecorder
- Permissão de microfone
- Chave da API OpenAI

## 🛠️ Estrutura do Projeto

\`\`\`
├── app/
│   ├── api/
│   │   ├── transcribe/route.ts  # API para transcrição
│   │   └── chat/route.ts        # API para chat com IA
│   └── page.tsx                 # Componente principal
├── .env.local                   # Variáveis de ambiente
└── README.md                    # Este arquivo
\`\`\`

## 🔒 Segurança

- A chave da API fica apenas no servidor (variáveis de ambiente)
- Não é exposta no código do cliente
- Todas as chamadas passam pelas API routes do Next.js

## 🎯 Próximos passos

- [ ] Histórico de conversas
- [ ] Suporte a múltiplos idiomas
- [ ] Controles de gravação avançados
- [ ] Integração com outros modelos de IA
=======
# Chat_audio
>>>>>>> cb04e972bd174ce5f4f6bf91e715f597da3aa16d
