(function(){
    /** Library imports for Browserify */
    let $ = require('jbone');

    /** @constant {String} EMPTY - Represent an EMPTY square in the board */
    const EMPTY = '*';
    /** @constant {String} X - The X token for the board*/
    const X = 'X';
    /** @constant {String} O - The O token for the board */
    const O = 'O';
    /**
     * @constant {Number} RESET_TIME - Time in milliseconds to wait
     * for reseting the game.
     */
    const RESET_TIME = 2500;

    /**
     * Answer if the row isn't empty and all their elements are equal.
     * @param {String[]} row - Array of tokens of one winning line.
     * @returns {Boolean} True if all line elements are equal and not the
     * empty token, false otherwise.
     */
    function threeInARow(row) {
        let repeats = new Set(row);
        return (repeats.size === 1) && (!repeats.has(EMPTY));
    }

    /**
     * Answer if the given player has two tokens in the row, so a direct
     * win situation.
     * @param {String[]} row - Array of tokens of one winning line.
     * @param {String} player - The token of the player to check.
     * @returns {Boolean} True if there is two player tokens and any rival
     * tokens, false otherwise.
     */
    function twoInARow(row, player) {
        let uniques = new Set(row);
        if ((uniques.size === 3) || !uniques.has(EMPTY)) {
            return false;
        }
        let playerTokens = row.filter(element => element === player);
        return playerTokens.length === 2;
    }

    /**
     * Answer if the given player has placed the only token placed in the
     * current row.
     * @param {String[]} row - Array of tokens of one winning line.
     * @param {String} player - The token of the player to check.
     * @returns {Boolean} True if there is one player token and any rival
     * tokens, false otherwise.
     */
    function oneInARow(row, player) {
        return (twoInARow(row, EMPTY) && (row.indexOf(player) !== -1));
    }

    /** Class representing a board. */
    class Board {
        /** Create a board. */
        constructor() {
            this.squares = Array(9).fill(EMPTY);
            this.lines= [[0,1,2], [3,4,5], [6,7,8], // horizontal
                         [0,3,6], [1,4,7], [2,5,8], // vertical
                         [0,4,8],[2,4,6]];          // diagonal
            this.crossLines = {
                0: [[0, 1, 2], [0, 3, 6], [0, 4, 8]],
                1: [[0, 1, 2], [1, 4, 7]],
                2: [[0, 1, 2], [2, 5, 8]],
                3: [[3, 4, 5], [0, 3, 6]],
                4: [[3, 4, 5], [1, 4, 5], [0, 4, 8]],
                5: [[3, 4, 5], [2, 5, 8]],
                6: [[6, 7, 8], [0, 3, 6], [2, 4, 6]],
                7: [[6, 7, 8], [1, 4, 7]],
                8: [[6, 7, 8], [2, 5, 8], [0, 4, 8]]
            };
            this.center = 4;
            this.corners = new Map([[0, 8], [2, 6], [6, 2], [8, 0]]);
            this.middles = [1, 7, 3, 5];

            this.getReady();
        }

        /** Clear and prepare the board for a new game */
        getReady() {
            for (let i = 0; i < 9; i++) {
                this[`$square${i}`] = $(`#square${i}`);
                this[`$square${i}`].html('').removeAttr('disabled')
                .removeClass('fade winner1 winner2 winner3');
            }
        }

        /**
         * Place the token of a player in the board.
         * @param {Number} move - The position where the token will be placed.
         * @param {String} player - The token of the player.
         */
        makeMove(move, player) {
            this.squares[move] = player;
            let tokenAlt = (player === 'X')? 'Cross': 'Circle';
            let token = `<img class="token-img" src="app/assets/images/${player}.svg" alt="${tokenAlt}">`;
            this[`$square${move}`].html(token).attr('disabled', '');
        }
    }

    /** Class representing a Tic Tac Toe game */
    class TicTacToe {
        /**
         * Create a Tic Tac Toe game.
         * @property {Board} board - The board where the game is played.
         * @property {Object.<String, String>} - Pairs each token with their
         * opposite, for easy switching between player tokens.
         * @property {Number} turn - The actual turn of the game.
         * @property {Array[]} lines - Array of winning lines in a Tic Tac Toe
         * game.
         */
        constructor() {
            this.board = new Board();
            this.rival = {'O': 'X', 'X': 'O'};
            this.turn = 0;

            this.cacheDom();
            this.bindEvents();
        }

        /** Cache the DOM elements of the board */
        cacheDom() {
            this.$board = $('#board');
            this.$square = $('.square');
            this.$modal = $('.modal');
        }

        /** Bind events to DOM elements */
        bindEvents() {
            this.$square.on('click', this.handleMove.bind(this));
        }

        /** Enable the board, making it clickable. */
        enableBoard() {
            this.$board.removeClass('disabled');
        }

        /** Disable the board, making it unclickable. */
        disableBoard() {
            this.$board.addClass('disabled');
        }

        /**
         * Handle an user move try.
         * @param {Object} event - The event associated to a click
         * in a board square (a move) made by the user.
         */
        handleMove(event) {
            let move = Number(event.currentTarget.dataset.square);
            this.board.makeMove.bind(this.board)(move, this.humanToken);
            this.continueGame(this.humanToken, this.cpuPlayer);
        }

        /**
         * Check if the game can continue or not and act according to that.
         * If game can continue, run the next player turn.
         * If not, announce the result, reset the game and show the modal.
         * @param {String} player - The token of the actual player.
         * @param {Function} playerFunction - The function to execute if the
         * game should continue.
         */
        continueGame(player, playerFunction) {
            if (this.isGameOver()) {
                let winner = this.getWinner();
                let message;
                if (winner) {
                    let human = (winner.token === this.humanToken);
                    this.highlightLine(winner.line);
                    message = (human)? 'YOU WIN!': 'CPU WINS!';
                } else {
                    message = 'IT\'S A TIE!';
                }
                /* Change the tab title for the game result */
                document.title = message;
                window.setTimeout(this.reset.bind(this), RESET_TIME);
            } else {
                playerFunction.bind(this)(this.rival[player]);
            }
        }

        /**
         * Reset a Tic Tac Toe Game.
         */
        reset() {
            this.board = new Board();
            this.turn = 0;
            this.$modal.removeClass('hidden');
            document.title = 'Tic Tac Toe';
        }

        /**
         * Get squares still available (empty) in the board.
         * @returns {Number[]} List of empty squares in the board.
         */
        getValidMoves() {
            let squares = this.board.squares;
            let emptySquare = function(element, index) {
                return squares[index] === EMPTY;
            };
            return [...squares.keys()].filter(emptySquare.bind(this));
        }

        /**
         * Answer if the game has come to an end.
         * @returns {Boolean} True or false if game has come to an end or not.
         */
        isGameOver() {
            return this.getWinner() || !this.getValidMoves().length;
        }

        /**
         * Convert a board positions array to a board tokens array.
         * @param {Number[]} indexArr - The array of board positions.
         */
        toTokenArray(indexArr) {
            return indexArr.map(element => this.board.squares[element]);
        }

        /**
         * Check if a move is a fork move.
         * @param {Number} forkCandidate - The position to check.
         * @player {String} player - The player for whom the check is being done.
         * @returns {Boolean} true if it's a fork move, false otherwise.
         */
        isForkMove(forkCandidate, player) {

            let isForkLine = function (crossline) {
                let tokens = this.toTokenArray(crossline);
                return oneInARow(tokens, player);
            };
            let forkLines = this.board.crossLines[forkCandidate]
                            .filter(isForkLine.bind(this));
            return forkLines.length > 1;
        }

        /**
         * Get the token of the winner player.
         * @returns {?Array<String, Number[]>} The token of the actual winner. null means a tie.
         */
        getWinner() {
            for (let line of this.board.lines) {
                let row = this.toTokenArray(line);
                if (threeInARow(row)) {
                    return {'token': row[0], 'line': line};
                }
            }
            return null;
        }

        /**
         * Highlight the given line in the board.
         * @param {Number[]} line - The line to be highlighted.
         */
        highlightLine(line) {
            let squareNumber = 1;
            for (let square = 0; square < 9; square++) {
                if (line.indexOf(square) === -1) {
                    this.board[`$square${square}`].addClass('fade');
                } else {
                    this.board[`$square${square}`]
                    .addClass(`winner${squareNumber}`);
                    squareNumber++;
                }
            }
        }

        /**
         * Get the best move to do for CPU to never lose.
         * @param {String} player - The CPU player token.
         * @returns {Number} The best move to do for not lose.
         */
        bestMove(player) {
            // if cpu has two in a row, win
            for (let line of this.board.lines) {
                let row = this.toTokenArray(line);
                if (twoInARow(row, player)) {
                    return line[row.indexOf(EMPTY)];
                }
            }
            // if human has two in a row, block him
            for (let line of this.board.lines) {
                let row = this.toTokenArray(line);
                if (twoInARow(row, this.humanToken)) {
                    return line[row.indexOf(EMPTY)];
                }
            }
            // if there's a chance to create a fork create it
            let validMoves = this.getValidMoves();
            for (let square of validMoves) {
                if (this.isForkMove(square, player)) {
                    return square;
                }
            }
            // if there's a chance to the opponent to create a fork, block it
            for (let square of validMoves) {
                if (this.isForkMove(square, this.humanToken)) {
                    return square;
                }
            }
            // if center is free, taken it
            if (validMoves.indexOf(this.board.center) !== -1) {
                return this.board.center;
            }
            // if the opponent takes a corner, play the opposite corner
            let corners = [...this.board.corners.entries()];
            let oppositeCorners = corners
                               .filter((key, value) =>
                               (this.board.squares[key] === this.humanToken)
                               && (this.board.squares[value] === EMPTY));
            if (oppositeCorners.length) {
                let value = this.board.corners.get(oppositeCorners[0][0]);
                return value;
            }
            // if there's a empty corner, take it
            for (let corner of this.board.corners.keys()) {
                if (this.board.squares[corner] === EMPTY) {
                    return corner;
                }
            }
            // if there's an empty middle square, take it
            for (let middle of this.board.middles) {
                if (this.board.squares[middle] === EMPTY) {
                    return middle;
                }
            }
        }

        /**
         * Run cpu player turn.
         * @param {String} player - Token for the actual player.
         */
        cpuPlayer(player) {
            console.time('cpu move');
            this.disableBoard();
            let move;
            if (this.turn) {
                move = this.bestMove(player);
            } else {
                move = Math.floor(Math.random() * this.getValidMoves().length);
            }
            this.board.makeMove.bind(this.board)(move, player);
            console.timeEnd('cpu move');
            this.continueGame(player, this.humanPlayer);
        }

        /**
         * Run human player turn.
         * @param {String} player - Token for the actual player.
         */
        humanPlayer(player) {
            this.turn++;
            this.enableBoard();
        }

        /**
         * Start the Tic Tac Toe game.
         * An OptionsModal should be instantiated for this to work.
         */
        start() {
            if (this.playerOne === 'human') {
                this.humanPlayer(this.humanToken);
            } else {
                this.cpuPlayer(this.rival[this.humanToken]);
            }
        }
    }

    /** Class representing an options modal window for the game. */
    class OptionsModal {
        /**
         * Create a modal for a Tic Tac Toe game.
         * @param {Object} game - A TicTacToe instance.
         */
        constructor(game) {
            this.game = game;
            this.cacheDom();
            this.bindEvents();
        }

        /** Cache the DOM elements of the modal */
        cacheDom() {
            this.$tokens = $('.token');
            this.$players = $('.player');
            this.$start = $('#start-btn');
            this.$modal = $('.modal');
        }

        /** Bind events to DOM elements */
        bindEvents() {
            this.$tokens.on('click', this.handleTokenSelection.bind(this));
            this.$players.on('click', this.handlePlayerSelection.bind(this));
            this.$start.on('click', this.handleStart.bind(this));
        }

        /**
         * Handle the token selection by the user.
         * @param {Object} event - The event associated to a click
         * in a token button made by the user, choosing their token.
         */
        handleTokenSelection(event) {
            let $this = $(event.currentTarget);
            if ($this.hasClass('unselected')) {
                this.$tokens.toggleClass('unselected');
                this.token = $this.attr('data-token');
            }
        }

        /**
         * Handle the selection of player one by the user.
         * @param {Object} event - The event associated to a click
         * in a player button made by the user, choosing which player
         * will start the game.
         */
        handlePlayerSelection(event) {
            let $this = $(event.currentTarget);
            if ($this.hasClass('unselected')) {
                this.$players.toggleClass('unselected');
                this.playerOne = $this.attr('data-playerone');
            }
        }

        /**
         * Handle the click in the modal start button by the user.
         * @param {Object} event - The event associated to a click
         * in the start button made by the user, for starting the game.
         */
        handleStart(event) {
            this.game.playerOne = this.playerOne || 'human';
            this.game.humanToken = this.token || 'X';
            this.$modal.addClass('hidden');
            this.game.start();
        }
    }

    /** Create and launch a Tic Tac Toe game. */
    function newGame(){
        let ttt = new TicTacToe();
        let modal = new OptionsModal(ttt);
    }

    newGame();
})();