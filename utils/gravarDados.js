const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const {
    connection
} = require('../utils/connection.js')

const {
    entradaSaidaPorMes,
    somaCategoria,
    entradaSaidaPorDia
} = require('../utils/funcStats.js')


async function gravarTransacaoMassivas(data, id) {
    try {
        let i;
        for (i = 0; i < data.length; i++) {
            await connection.promise().query(`INSERT INTO transacoes_${id} (s_nome_transacoes, s_categoria_transacoes, i_valor_transacoes, s_tipo_transacoes, dt_data_transacoes) 
            VALUES (?, ?, ?, ?, ?)`, [data[i].nome_transacao, data[i].categoria_transacao, data[i].valor_transacao, data[i].tipo_transacao, data[i].data_transacao]);
        }
        return "Inserções realizadas com sucesso";
    } catch (error) {
        console.error("Erro ao gravar transações massivas:", error);
        return "Ocorreu um erro ao inserir as transações.";
    }
}

async function gravarTodasTransacoes(userId) {
    const query = await connection.promise().query(`SELECT * FROM transacoes_${userId} ORDER BY dt_data_transacoes`)
    const results = query[0]
    
    const arqDeTransacoes = await gerarArquivoDeTransacoesCsv(results, 00, null, userId)
    return arqDeTransacoes
}

async function gravarTransacoesMes(mes, ano, userId) {
    const query = await connection.promise().query(`SELECT * FROM transacoes_${userId} WHERE DATE_FORMAT(dt_data_transacoes, '%Y-%m') = '${ano}-${mes}' ORDER BY dt_data_transacoes`)
    const results = query[0]
    
    const arqDeTransacoes = await gerarArquivoDeTransacoesCsv(results, mes, ano, userId)
    return arqDeTransacoes
}


async function gerarArquivoDeTransacoesCsv(query, mes, ano, userId){
    let pathDoc;
    let linkDownload
    if(mes == 00 && ano == null){
        pathDoc = `./public/arqExportacao/todasTranscoes-user-${userId}.csv`
        linkDownload = `/arqExportacao/todasTranscoes-user-${userId}.csv`
    } else {
        pathDoc = `./public/arqExportacao/transacoes-${mes}-${ano}-user-${userId}.csv`
        linkDownload = `/arqExportacao/transacoes-${mes}-${ano}-user-${userId}.csv`
    }
    
    const csvWriter = createCsvWriter({
        path: pathDoc,
        header: [{
                id: 'id_transacoes',
                title: 'ID Transacao'
            },
            {
                id: 's_nome_transacoes',
                title: 'Nome Transacao'
            },
            {
                id: 's_categoria_transacoes',
                title: 'Categoria Transacao'
            },
            {
                id: 'i_valor_transacoes',
                title: 'Valor Transacao'
            },
            {
                id: 's_tipo_transacoes',
                title: 'Tipo Transacao'
            },
            {
                id: 'dt_data_transacoes',
                title: 'Data Transacao'
            }
        ]
    })

    return csvWriter.writeRecords(query)
        .then(() => {
            console.log('Dados gravados com sucesso no arquivo CSV.');
            const localGravado = {
                error: false,
                mensagem: `O arquivo foi gravo no seguinte endereco ${pathDoc}`,
                path: pathDoc,
                linkParaDownload: linkDownload
            }
            return localGravado
        })
        .catch(err => {
            console.error('Erro ao gravar os dados no arquivo CSV: ', err)
            const localGravado = {
                error: true,
                mensagem: `Houve um erro ao salvar o arquivo no seguinte endereco ${pathDoc}`,
                path: pathDoc,
                linkParaDownload: linkDownload
            }
            return localGravado
        })
}


module.exports = {
    gravarTodasTransacoes,
    gravarTransacoesMes,
    gravarTransacaoMassivas
}