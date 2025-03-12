class JogoDaVelha {
    constructor() {
        this.tabuleiro = Array(9).fill('');
        this.jogadorAtual = 'X';
        this.iaAtiva = true;
        this.jogoTerminado = false;
        this.nomeJogador = '';
        this.nomeIA = 'HAL-9000';
        this.nivel = 'normal';
        this.errosPorNivel = {
            'facil': 0.8,    // 80% de chance de erro
            'normal': 0.4,   // 40% de chance de erro
            'dificil': 0.1   // 10% de chance de erro
        };
        this.ultimaJogadaFoiErro = false;
        this.placar = {
            jogador: 0,
            ia: 0,
            empates: 0
        };

        // Elementos do DOM
        this.celulas = document.querySelectorAll('.celula');
        this.statusElement = document.querySelector('.status');
        this.btnReiniciar = document.getElementById('reiniciar');
        this.btnModoIA = document.getElementById('modo-ia');
        this.btnModoPVP = document.getElementById('modo-pvp');
        this.dialogoNome = document.getElementById('dialogo-nome');
        this.inputNome = document.getElementById('nome-jogador');
        this.btnComecar = document.getElementById('comecar-jogo');
        this.btnsNivel = document.querySelectorAll('.btn-dificuldade');
        this.mensagemErro = document.querySelector('.mensagem-erro');
        this.seletorNivel = document.getElementById('mudar-nivel');
        this.spanVitoriasJogador = document.getElementById('vitorias-jogador');
        this.spanVitoriasIA = document.getElementById('vitorias-ia');
        this.spanEmpates = document.getElementById('empates');
        this.btnZerarPlacar = document.getElementById('zerar-placar');

        // Desabilitar apenas o tabuleiro até que o jogador insira seu nome
        this.celulas.forEach(celula => celula.style.pointerEvents = 'none');

        // Inicializar eventos
        this.inicializarEventos();
    }

    carregarPlacar() {
        const todosPlacares = JSON.parse(localStorage.getItem('jogoVelhaPlacares') || '{}');
        return todosPlacares[this.nomeJogador] || {
            jogador: 0,
            ia: 0,
            empates: 0
        };
    }

    salvarPlacar() {
        const todosPlacares = JSON.parse(localStorage.getItem('jogoVelhaPlacares') || '{}');
        todosPlacares[this.nomeJogador] = this.placar;
        localStorage.setItem('jogoVelhaPlacares', JSON.stringify(todosPlacares));
        this.atualizarPlacarVisual();
    }

    zerarPlacar() {
        if (confirm(`Tem certeza que deseja zerar o placar de ${this.nomeJogador}?`)) {
            this.placar = {
                jogador: 0,
                ia: 0,
                empates: 0
            };
            this.salvarPlacar();
        }
    }

    atualizarPlacarVisual() {
        this.spanVitoriasJogador.textContent = this.placar.jogador;
        this.spanVitoriasIA.textContent = this.placar.ia;
        this.spanEmpates.textContent = this.placar.empates;
    }

    inicializarEventos() {
        this.celulas.forEach(celula => {
            celula.addEventListener('click', () => this.fazerJogada(celula));
        });

        this.btnReiniciar.addEventListener('click', () => this.reiniciarJogo());

        this.btnZerarPlacar.addEventListener('click', () => this.zerarPlacar());

        this.btnsNivel.forEach(btn => {
            btn.addEventListener('click', () => {
                this.btnsNivel.forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
                this.nivel = btn.dataset.nivel;
                this.seletorNivel.value = this.nivel;
            });
        });

        this.seletorNivel.addEventListener('change', (e) => {
            this.nivel = e.target.value;
        });

        this.btnComecar.addEventListener('click', () => {
            const nome = this.inputNome.value.trim();
            if (nome) {
                this.nomeJogador = nome;
                this.placar = this.carregarPlacar();
                this.dialogoNome.style.display = 'none';
                this.celulas.forEach(celula => celula.style.pointerEvents = 'auto');
                this.statusElement.textContent = `Vez de ${this.nomeJogador} (X)`;
                this.btnModoIA.textContent = `${this.nomeJogador} vs ${this.nomeIA}`;
                document.querySelector('.jogador-nome').textContent = this.nomeJogador;
                this.atualizarPlacarVisual();
            } else {
                alert('Por favor, digite seu nome para começar!');
            }
        });

        this.inputNome.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.btnComecar.click();
            }
        });
    }

    mostrarMensagemErro() {
        this.mensagemErro.textContent = 'Ops, errei!';
        this.mensagemErro.style.display = 'block';
        setTimeout(() => {
            this.mensagemErro.style.display = 'none';
        }, 2000);
    }

    fazerJogada(celula) {
        const index = celula.dataset.index;

        if (this.tabuleiro[index] === '' && !this.jogoTerminado) {
            this.tabuleiro[index] = this.jogadorAtual;
            celula.textContent = this.jogadorAtual;
            
            if (this.verificarVitoria()) {
                const vencedor = this.jogadorAtual === 'X' ? this.nomeJogador : this.nomeIA;
                this.statusElement.textContent = `${vencedor} venceu!`;
                this.jogoTerminado = true;
                
                // Atualizar placar
                if (this.jogadorAtual === 'X') {
                    this.placar.jogador++;
                } else {
                    this.placar.ia++;
                }
                this.salvarPlacar();
                return;
            }

            if (this.verificarEmpate()) {
                this.statusElement.textContent = 'Empate!';
                this.jogoTerminado = true;
                this.placar.empates++;
                this.salvarPlacar();
                return;
            }

            this.jogadorAtual = this.jogadorAtual === 'X' ? 'O' : 'X';
            this.statusElement.textContent = `Vez de ${this.jogadorAtual === 'X' ? this.nomeJogador + ' (X)' : this.nomeIA + ' (O)'}`;

            if (this.iaAtiva && this.jogadorAtual === 'O') {
                this.celulas.forEach(celula => celula.style.pointerEvents = 'none');
                setTimeout(() => {
                    this.jogadaIA();
                    if (this.ultimaJogadaFoiErro) {
                        this.mostrarMensagemErro();
                        this.ultimaJogadaFoiErro = false;
                    }
                    this.celulas.forEach(celula => {
                        if (!this.jogoTerminado) {
                            celula.style.pointerEvents = 'auto';
                        }
                    });
                }, 500);
            }
        }
    }

    jogadaIA() {
        if (this.jogoTerminado) return;

        const deveErrar = Math.random() < this.errosPorNivel[this.nivel];
        
        if (deveErrar) {
            // Fazer uma jogada aleatória em vez da melhor jogada
            const celulasVazias = Array.from(this.celulas)
                .filter((_, index) => this.tabuleiro[index] === '');
            
            if (celulasVazias.length > 0) {
                const jogadaAleatoria = celulasVazias[Math.floor(Math.random() * celulasVazias.length)];
                this.ultimaJogadaFoiErro = true;
                this.fazerJogada(jogadaAleatoria);
                return;
            }
        }

        // Jogada normal com Minimax
        const melhorJogada = this.encontrarMelhorJogada();
        this.ultimaJogadaFoiErro = false;
        this.fazerJogada(this.celulas[melhorJogada]);
    }

    encontrarMelhorJogada() {
        let melhorPontuacao = -Infinity;
        let melhorJogada = 0;

        for (let i = 0; i < 9; i++) {
            if (this.tabuleiro[i] === '') {
                this.tabuleiro[i] = 'O';
                let pontuacao = this.minimax(this.tabuleiro, 0, false);
                this.tabuleiro[i] = '';

                if (pontuacao > melhorPontuacao) {
                    melhorPontuacao = pontuacao;
                    melhorJogada = i;
                }
            }
        }

        return melhorJogada;
    }

    minimax(tabuleiro, profundidade, eMaximizando) {
        const resultado = this.verificarVencedor();
        
        if (resultado !== null) {
            return resultado === 'O' ? 1 : resultado === 'X' ? -1 : 0;
        }

        if (eMaximizando) {
            let melhorPontuacao = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (tabuleiro[i] === '') {
                    tabuleiro[i] = 'O';
                    let pontuacao = this.minimax(tabuleiro, profundidade + 1, false);
                    tabuleiro[i] = '';
                    melhorPontuacao = Math.max(pontuacao, melhorPontuacao);
                }
            }
            return melhorPontuacao;
        } else {
            let melhorPontuacao = Infinity;
            for (let i = 0; i < 9; i++) {
                if (tabuleiro[i] === '') {
                    tabuleiro[i] = 'X';
                    let pontuacao = this.minimax(tabuleiro, profundidade + 1, true);
                    tabuleiro[i] = '';
                    melhorPontuacao = Math.min(pontuacao, melhorPontuacao);
                }
            }
            return melhorPontuacao;
        }
    }

    verificarVitoria() {
        const linhasVitoria = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
            [0, 4, 8], [2, 4, 6]             // Diagonais
        ];

        return linhasVitoria.some(linha => {
            const [a, b, c] = linha;
            return this.tabuleiro[a] &&
                   this.tabuleiro[a] === this.tabuleiro[b] &&
                   this.tabuleiro[a] === this.tabuleiro[c];
        });
    }

    verificarVencedor() {
        const linhasVitoria = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let linha of linhasVitoria) {
            const [a, b, c] = linha;
            if (this.tabuleiro[a] && this.tabuleiro[a] === this.tabuleiro[b] && this.tabuleiro[a] === this.tabuleiro[c]) {
                return this.tabuleiro[a];
            }
        }

        if (this.tabuleiro.includes('')) {
            return null;
        }
        return 'empate';
    }

    verificarEmpate() {
        return !this.tabuleiro.includes('');
    }

    reiniciarJogo() {
        this.tabuleiro = Array(9).fill('');
        this.jogadorAtual = 'X';
        this.jogoTerminado = false;
        this.ultimaJogadaFoiErro = false;
        this.mensagemErro.style.display = 'none';
        this.celulas.forEach(celula => {
            celula.textContent = '';
            celula.style.pointerEvents = 'auto';
        });
        this.statusElement.textContent = `Vez de ${this.nomeJogador} (X)`;
    }
}

// Iniciar o jogo
const jogo = new JogoDaVelha(); 