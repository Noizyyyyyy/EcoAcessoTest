import sql from './db.js'; // Importa a conexão PostgreSQL
import bcrypt from 'bcryptjs';
import { cpf } from 'node-cpf';

// Expressão Regular para validação básica de formato de e-mail
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// O Vercel reconhece ficheiros .js com 'export default' como Serverless Functions
export default async (req, res) => {
    // 1. Apenas aceita requisições POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido. Use POST.' });
        return;
    }

    try {
        const data = req.body;

        // Validação de campos obrigatórios
        if (!data.email || !data.senha || !data.termos_aceitos || !data.cpf) {
            res.status(400).json({ error: 'Dados essenciais (e-mail, senha, termos e CPF) ausentes.' });
            return;
        }

        // --- VALIDAÇÃO DE FORMATO DE E-MAIL ---
        if (!emailRegex.test(data.email)) {
            res.status(400).json({ error: 'O formato do e-mail é inválido. Verifique o endereço.' });
            return;
        }

        // --- VALIDAÇÃO DE CPF (Estrutural) ---
        const cpfLimpo = data.cpf.replace(/\D/g, ''); 
        
        if (!cpf.validate(cpfLimpo)) {
            res.status(400).json({ error: 'O CPF fornecido é inválido. Verifique os números.' });
            return;
        }
        
        // --- CRIPTOGRAFIA DE SENHA ---
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(data.senha, salt);

        // 3. Mapeia os dados do formulário para o formato da tabela 'cadastro'
        const cadastroData = {
            nome_completo: data.nome_completo || data.nome || null, 
            email: data.email,
            telefone: data.telefone || null,
            data_nascimento: data['data-nascimento'] || null, 
            cpf: cpfLimpo,
            senha_hash: senhaHash, 
            cep: data.cep || null,
            logradouro: data.logradouro || null,
            numero: data.numero || null,
            complemento: data.complemento || null,
            bairro: data.bairro || null,
            cidade: data.cidade || null,
            estado: data.estado || null,
            termos_aceitos: data.termos_aceitos,
            email_confirmado: true, 
        };

        // 4. INSERÇÃO NO BANCO DE DADOS (usando o cliente 'postgres')
        // O comando 'sql` utiliza um array para fazer uma inserção segura (sem SQL Injection)
        await sql`
            INSERT INTO cadastro 
                ${ sql(cadastroData) }
        `;

        // 5. Retorna sucesso para o Front-end
        res.status(201).json({ 
            message: 'Cadastro realizado com sucesso! Redirecionando...', 
            email: data.email
        });

    } catch (e) {
        console.error('Erro na Serverless Function (Try/Catch):', e);
        // Trata erros de duplicidade (que geralmente contêm o erro 23505 no log do postgres)
        if (e.code === '23505') {
            res.status(409).json({ error: 'E-mail ou CPF já cadastrado.' });
        } else {
            // Se falhar a conexão, esta será a mensagem
            res.status(500).json({ error: `Falha no processamento da API. Erro: ${e.message}. Verifique a DATABASE_URL no Vercel.` });
        }
    }
};