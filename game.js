class Game {
    constructor() {
        this.score = 0;
        this.resources = 50;
        this.bananaChips = 100; // Starting banana chips
        this.grid = [];
        this.selectedBananaType = null;
        this.gameLoop = null;
        this.monkeys = [];
        this.projectiles = [];
        this.lastChipIncrease = Date.now();
        this.init();
    }

    init() {
        this.createGrid();
        this.createBananaSelection();
        this.updateScore();
        this.updateResources();
        this.startGameLoop();
    }

    createGrid() {
        const gameGrid = document.getElementById('gameGrid');
        for (let row = 0; row < 5; row++) {
            this.grid[row] = [];
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gameGrid.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    banana: null,
                    monkey: null
                };
            }
        }
    }

    createBananaSelection() {
        const bananaSelection = document.querySelector('.banana-selection');
        const bananaTypes = [
            { name: 'Basic Banana', cost: 10 },
            { name: 'Super Banana', cost: 20 },
            { name: 'Mega Banana', cost: 30 }
        ];

        bananaTypes.forEach(type => {
            const bananaButton = document.createElement('div');
            bananaButton.className = 'banana-type';
            bananaButton.dataset.type = type.name;
            bananaButton.dataset.cost = type.cost;
            bananaButton.addEventListener('click', () => this.selectBananaType(type));
            bananaSelection.appendChild(bananaButton);
        });
    }

    selectBananaType(type) {
        this.selectedBananaType = type;
    }

    handleCellClick(row, col) {
        if (!this.selectedBananaType) return;
        if (this.resources < this.selectedBananaType.cost) return;
        if (this.grid[row][col].banana) return;

        this.placeBanana(row, col);
    }

    placeBanana(row, col) {
        this.resources -= this.selectedBananaType.cost;
        
        // Create banana shooter element
        const bananaShooter = document.createElement('div');
        bananaShooter.className = 'banana-shooter';
        bananaShooter.style.backgroundImage = 'url("Banana Sprites/banana_shooter.png")';
        bananaShooter.style.backgroundSize = 'contain';
        bananaShooter.style.backgroundRepeat = 'no-repeat';
        bananaShooter.style.width = '100%';
        bananaShooter.style.height = '100%';
        bananaShooter.style.position = 'absolute';
        
        this.grid[row][col].element.appendChild(bananaShooter);
        this.grid[row][col].banana = {
            type: this.selectedBananaType,
            health: 100,
            element: bananaShooter,
            lastShot: 0
        };
        
        this.updateResources();
    }

    spawnMonkey() {
        const row = Math.floor(Math.random() * 5);
        const monkeyElement = document.createElement('div');
        monkeyElement.className = 'monkey';
        monkeyElement.style.backgroundImage = 'url("Monkey Sprites/monkey.png")';
        monkeyElement.style.backgroundSize = 'contain';
        monkeyElement.style.backgroundRepeat = 'no-repeat';
        monkeyElement.style.width = '100%';
        monkeyElement.style.height = '100%';
        monkeyElement.style.position = 'absolute';
        monkeyElement.style.transition = 'left 0.1s linear';
        
        const monkey = {
            row: row,
            col: 8,
            health: 100,
            speed: 0.05, // Cells per tick
            element: monkeyElement,
            position: 8 // Exact position for smooth movement
        };
        
        this.grid[row][8].element.appendChild(monkeyElement);
        this.grid[row][8].monkey = monkey;
        this.monkeys.push(monkey);
    }

    updateGame() {
        // Move monkeys
        this.monkeys = this.monkeys.filter(monkey => {
            // Update position
            monkey.position -= monkey.speed;
            const newCol = Math.floor(monkey.position);
            
            // Remove monkey if it reaches the left edge
            if (newCol < 0) {
                monkey.element.remove();
                this.grid[monkey.row][monkey.col].monkey = null;
                return false;
            }
            
            // Update grid position if monkey moves to new cell
            if (newCol !== monkey.col) {
                this.grid[monkey.row][monkey.col].monkey = null;
                this.grid[monkey.row][newCol].monkey = monkey;
                this.grid[monkey.row][newCol].element.appendChild(monkey.element);
                monkey.col = newCol;
            }
            
            // Update visual position
            const percentageAcrossCell = (monkey.position - newCol) * 100;
            monkey.element.style.left = `${percentageAcrossCell}%`;
            
            return true;
        });
    }

    startGameLoop() {
        let lastUpdate = Date.now();
        this.gameLoop = setInterval(() => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastUpdate) / 1000;
            lastUpdate = currentTime;
            
            this.updateGame();
            this.updateProjectiles(deltaTime);
            
            // Spawn monkeys
            if (Math.random() < 0.02) { // 2% chance to spawn monkey each tick
                this.spawnMonkey();
            }
            
            // Generate banana chips over time
            if (currentTime - this.lastChipIncrease >= 5000) { // Every 5 seconds
                this.bananaChips += 2;
                this.updateResources();
                this.lastChipIncrease = currentTime;
            }
            
            // Check for shooting
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 9; col++) {
                    const cell = this.grid[row][col];
                    if (cell.banana) {
                        const currentTime = Date.now();
                        if (currentTime - cell.banana.lastShot >= 2000) { // Shoot every 2 seconds
                            // Find closest monkey in the row
                            const targetMonkey = this.monkeys.find(monkey => 
                                monkey.row === row && monkey.col > col
                            );
                            if (targetMonkey) {
                                const projectile = this.createProjectile(
                                    { ...cell.banana, row, col }, 
                                    targetMonkey
                                );
                                this.projectiles.push(projectile);
                                cell.banana.lastShot = currentTime;
                            }
                        }
                    }
                }
            }
        }, 100);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateResources() {
        document.getElementById('resources').textContent = this.resources;
        document.getElementById('chips').textContent = this.bananaChips;
    }

    createProjectile(banana, targetMonkey) {
        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.style.position = 'absolute';
        projectile.style.width = '20px';
        projectile.style.height = '20px';
        projectile.style.backgroundColor = 'yellow';
        projectile.style.borderRadius = '50%';
        projectile.style.zIndex = '3';
        
        const startCell = this.grid[banana.row][banana.col].element;
        const startRect = startCell.getBoundingClientRect();
        
        projectile.style.left = startRect.left + 'px';
        projectile.style.top = startRect.top + 'px';
        
        document.body.appendChild(projectile);
        
        return {
            element: projectile,
            startX: startRect.left,
            startY: startRect.top,
            targetMonkey: targetMonkey,
            speed: 300, // pixels per second
            damage: banana.type.name === 'Mega Banana' ? 40 : 
                   banana.type.name === 'Super Banana' ? 25 : 15
        };
    }

    updateProjectiles(deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.targetMonkey || !this.monkeys.includes(projectile.targetMonkey)) {
                projectile.element.remove();
                return false;
            }

            const targetRect = projectile.targetMonkey.element.getBoundingClientRect();
            const currentRect = projectile.element.getBoundingClientRect();
            
            // Calculate direction and movement
            const dx = targetRect.left - currentRect.left;
            const dy = targetRect.top - currentRect.top;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) { // Collision detected
                projectile.targetMonkey.health -= projectile.damage;
                if (projectile.targetMonkey.health <= 0) {
                    this.score += 10;
                    this.bananaChips += 5;
                    this.updateScore();
                    this.updateResources();
                    const monkeyIndex = this.monkeys.indexOf(projectile.targetMonkey);
                    if (monkeyIndex > -1) {
                        this.monkeys.splice(monkeyIndex, 1);
                        projectile.targetMonkey.element.remove();
                    }
                }
                projectile.element.remove();
                return false;
            }
            
            // Move projectile
            const moveX = (dx / distance) * projectile.speed * deltaTime;
            const moveY = (dy / distance) * projectile.speed * deltaTime;
            
            const newX = currentRect.left + moveX;
            const newY = currentRect.top + moveY;
            
            projectile.element.style.left = newX + 'px';
            projectile.element.style.top = newY + 'px';
            
            return true;
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
});
