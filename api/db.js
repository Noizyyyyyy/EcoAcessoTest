import postgres from 'postgres';

// A DATABASE_URL DEVE SER configurada como uma variável de ambiente SECRETA no Vercel.
// Este valor é a string de conexão completa do PostgreSQL do seu Supabase.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    // Esta mensagem aparecerá nos logs do Vercel se a variável estiver ausente.
    console.error("ERRO DE CONFIGURAÇÃO: A variável DATABASE_URL está ausente. A conexão com o banco de dados não será estabelecida.");
}

// Inicializa o cliente PostgreSQL.
// Este objeto 'sql' será exportado para ser usado no cadastrar.js.
const sql = postgres(connectionString);

export default sql;
