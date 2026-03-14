const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

async function conectarMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "produtosdb"
    });

    console.log("Conectado ao MongoDB Atlas");
    console.log("Banco em uso pelo mongoose:", mongoose.connection.name);
  } catch (err) {
    console.error("Erro ao conectar no MongoDB:", err);
  }
}

const produtoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true
    },
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    preco: {
      type: Number,
      required: true,
      min: 0
    },
    quantidade: {
      type: Number,
      required: true,
      min: 0
    },
    categoria: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

// força o nome da collection
const Produto = mongoose.model("Produto", produtoSchema, "produtos");

app.get("/api/debug-db", async (req, res) => {
  try {
    const total = await Produto.countDocuments({});
    const exemplo = await Produto.findOne({});

    res.json({
      banco_mongoose: mongoose.connection.name,
      collection: "produtos",
      total_documentos: total,
      exemplo
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao inspecionar banco" });
  }
});

app.get("/api/produtos", async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ createdAt: -1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

app.post("/api/produtos", async (req, res) => {
  try {
    const { nome, descricao, preco, quantidade, categoria } = req.body;

    if (
      !nome ||
      !descricao ||
      preco === undefined ||
      quantidade === undefined ||
      !categoria
    ) {
      return res.status(400).json({
        erro: "Nome, descrição, preço, quantidade e categoria são obrigatórios"
      });
    }

    const novoProduto = new Produto({
      nome,
      descricao,
      preco: Number(preco),
      quantidade: Number(quantidade),
      categoria
    });

    await novoProduto.save();

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});

app.delete("/api/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Produto.findByIdAndDelete(id);
    res.json({ mensagem: "Produto excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir produto" });
  }
});

conectarMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
});