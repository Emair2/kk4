let islands = [];
let fish = [];
let waterInk = [];

// 在全局范围内声明三个数组，用于存储岛屿、鱼和水墨粒子对象

function setup() {
    createCanvas(800, 600); // 创建一个800x600像素的画布
    background(255);  // 将背景颜色设置为白色，代表水

    // 创建岛屿
    for (let i = 0; i < 6; i++) {
        islands.push(new Island(random(width), random(height), random(20, 70))); // 创建6个随机位置和大小的岛屿
    }

    // 创建更多的鱼
    for (let i = 0; i < 1000; i++) { // 增加至1000条鱼
        fish.push(new Fish(random(width), random(height))); // 创建1000条随机位置的鱼
    }

    // 创建黑色水流
    for (let i = 0; i < 1000; i++) {
        waterInk.push(new WaterInk(random(10, 700), random(100, 500))); // 创建1000个随机位置的黑色水墨粒子
    }

    // 每5秒添加100条鱼
    setInterval(() => {
        for (let i = 0; i < 100; i++) {
            fish.push(new Fish(random(width), random(height))); // 每5秒在随机位置添加100条鱼
        }
    }, 5000);
}

function draw() {
    background(255); // 将背景颜色重置为白色
    islands.forEach(island => island.show()); // 显示所有岛屿
    waterInk.forEach(ink => {
        ink.move(islands, waterInk); // 更新每个水墨粒子的移动，将岛屿和所有水墨粒子传递给move方法
        ink.show(); // 显示水墨粒子
    });

    for (let i = fish.length - 1; i >= 0; i--) {
        fish[i].checkCollisions(waterInk); // 检查鱼是否碰撞到水墨粒子
        fish[i].avoid(islands); // 更新鱼的避障逻辑
        fish[i].move(); // 更新鱼的位置
        fish[i].show(); // 显示鱼
        if (fish[i].toDelete) {
            fish.splice(i, 1); // 如果鱼需要被删除，从数组中移除
        }
    }
}

class Island {
    constructor(x, y, size) {
        this.pos = createVector(x, y); // 设置岛屿的位置
        this.size = size; // 设置岛屿的大小
    }

    show() {
        fill(0, 100, 0); // 将岛屿颜色设置为绿色
        noStroke();
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.1) {
            let xoff = map(cos(a), -1, 1, 0, this.size);
            let yoff = map(sin(a), -1, 1, 0, this.size);
            let r = this.size + noise(xoff, yoff) * 25;
            vertex(this.pos.x + cos(a) * r, this.pos.y + sin(a) * r);
        }
        endShape(CLOSE);
    }
}

class WaterInk {
    constructor(x, y) {
        this.pos = createVector(x, y); // 设置水墨粒子的位置
        this.vel = p5.Vector.random2D(); // 设置水墨粒子的初始速度为随机方向
        this.vel.setMag(random(0.5, 1.5)); // 设置水墨粒子的速度大小
        this.size = 2; // 设置水墨粒子的大小
        this.maxSpeed = 1.5; // 设置水墨粒子的最大速度
    }

    move(islands, allParticles) {
        let noiseForce = p5.Vector.fromAngle(noise(this.pos.x * 0.01, this.pos.y * 0.01) * TWO_PI);
        noiseForce.setMag(0.1);
        this.vel.add(noiseForce); // 添加噪声力，使水墨粒子的移动更加随机

        // 添加粒子之间的排斥力，避免聚集
        let separationForce = createVector();
        allParticles.forEach(other => {
            if (other !== this) {
                let d = this.pos.dist(other.pos);
                if (d < 20 && d > 0) { // 距离小于20时排斥
                    let diff = p5.Vector.sub(this.pos, other.pos);
                    diff.normalize();
                    diff.div(d); // 距离越近，排斥力越大
                    separationForce.add(diff);
                }
            }
        });
        separationForce.mult(0.5);
        this.vel.add(separationForce); // 应用排斥力

        this.avoid(islands); // 避开岛屿
        this.pos.add(this.vel); // 更新位置
        this.vel.limit(this.maxSpeed); // 限制最大速度
        this.edges(); // 处理边界
    }

    avoid(islands) {
        islands.forEach(island => {
            let d = p5.Vector.dist(this.pos, island.pos);
            if (d < island.size + 20) {
                let escape = p5.Vector.sub(this.pos, island.pos).normalize().mult(this.maxSpeed);
                this.vel.add(escape); // 避开岛屿
            }
        });
    }

    edges() {
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    show() {
        fill(0);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2); // 显示水墨粒子
    }
}

class Fish {
    constructor(x, y) {
        this.position = createVector(x, y); // 设置鱼的位置
        this.velocity = p5.Vector.random2D(); // 设置鱼的初始速度为随机方向
        this.velocity.setMag(random(0.5, 1.5)); // 设置鱼的速度大小
        this.maxForce = 0.5; // 设置鱼的最大受力
        this.color = 'blue'; // 设置鱼的初始颜色为蓝色
        this.collisionCount = 0; // 初始化碰撞计数
    }

    checkCollisions(waterInk) {
        waterInk.forEach(ink => {
            let d = this.position.dist(ink.pos);
            if (d < ink.size + 5) {
                this.color = 'red'; // 如果鱼碰到水墨粒子，变成红色
                this.collisionCount++;
                if (this.collisionCount >= 3) {
                    this.toDelete = true; // 碰撞次数达到3次，标记为删除
                }
            }
        });
    }

    avoid(islands) {
        let steer = createVector();
        islands.forEach(island => {
            let d = this.position.dist(island.pos);
            if (d < island.size + 20) {
                let diff = p5.Vector.sub(this.position, island.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff); // 计算避开岛屿的转向力
            }
        });

        if (!steer.equals(createVector(0, 0))) {
            steer.normalize();
            steer.mult(this.maxForce);
            this.velocity.add(steer); // 应用转向力
        }

        this.velocity.limit(1.5); // 限制最大速度
    }

    move() {
        this.position.add(this.velocity); // 更新位置
        // 环绕边界处理
        if (this.position.x > width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = width;
        if (this.position.y > height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = height;
    }

    show() {
        fill(this.color);
        noStroke();
        ellipse(this.position.x, this.position.y, 8, 8); // 显示鱼
    }
}
