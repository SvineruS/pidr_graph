const len = 500;
const eth_base_fee = 1


function setup() {
    createCanvas(2000, 1000);
}

function draw() {
    randomSeed(seed.value);

    background(220);
    let {balance, amb_fee, eth_tx, amb_tx, validator_changes} = calc();

    // lines
    strokeWeight(2);
    stroke(2)
    for (let i = -5; i < 5; i++)
        line(0, yScale(i), width, yScale(i));
    stroke("red")
    line(0, yScale(0), width, yScale(0));
    // base fee
    stroke("purple")
    const base_fee = eth_base_fee + +batcher_per_tranfser.value;
    line(0, yScale(base_fee), width, yScale(base_fee));

    strokeWeight(5);
    drawLine(balance, '#00ff00');
    drawLine(amb_fee, '#0000ff');

    drawEllipses(validator_changes, '#ff0000', 10)
    drawEllipses(amb_tx, '#20d0ae', 20)
    drawEllipses(eth_tx, '#fda42c', 30)
}


function drawEllipses(arr, color, y) {
    noStroke();
    fill(color);
    // draw ellipses
    arr.forEach((v, i) => {
        let x = 10 + i * (width / (len - 1));
        ellipse(x, yScale(v), 15);
        ellipse(x, height-y, 15);
    })
}

function drawLine(arr, color) {
    stroke(color);
    // draw lines
    let px = 0;
    let py = yScale(arr[0]);
    for (let i = 0; i < arr.length; i++) {
        let x = 10 + i * (width / (len - 1));
        let y = yScale(arr[i]);
        line(px, py, x, y );

        //store the last position
        px = x;
        py = y;
    }
}

function yScale(y) {
    return height/2 - y * 100;
}


function calc() {
    let pid = new PID(p.value, i.value, d.value, 0)

    const fee = () => {
        let bal_index_stop = last_eth.checked ? last_eth_tx : balance.length-1;
        let bal = 0;
        for (let i = max(0, bal_index_stop - bal_window.value); i <= bal_index_stop; i++)
            bal += balance[i];
        bal /= bal_window.value;

        if (lower_bal.checked && bal > 0)
            bal = 0

        return max(min_fee.value, pid.compute(bal))
    }
    const last = (arr) => arr[arr.length-1]


    let balance = [0];
    let amb_fee = [1];

    let amb_tx = [];
    let eth_tx = [];
    let validator_changes = [];

    let amb_timeframe = 0
    let amb_transfers = 0
    let make_eth_tx = false
    let last_eth_tx = 0

    let timeframe = +tf.value


    for (let i = 0; i < len; i++)
        if (random() < vs_rate.value)
            validator_changes[i] = +vs_cost.value

    for (let i = 0; i < len - 1; i++) {
        balance[i] = last(balance)
        amb_fee[i] = last(amb_fee)

        if (i % 3 !== 0) {
            continue
        }

        if (i - last_eth_tx > timeframe*1.5)
            make_eth_tx = true

        if (make_eth_tx && amb_transfers > 0) {
            let validator_fee = validator_changes.slice(last_eth_tx, i).reduce((a, b) => a + b, 0);
            let eth_fee = eth_base_fee + batcher_per_tranfser.value * amb_transfers + validator_fee + (random()-0.4) * eth_fluctuation.value

            balance[i] -= eth_fee
            eth_tx[i] = eth_fee;
            amb_transfers = 0

            last_eth_tx = i
            make_eth_tx = false

        } else {
            if (random() > rate.value)
                continue


            let our_fee = fee()
            amb_fee[i] = our_fee
            balance[i] += our_fee
            amb_tx[i] = our_fee;
            amb_transfers += 1

            if (floor(i / timeframe) != amb_timeframe) {
                amb_timeframe = floor(i / timeframe)
                make_eth_tx = true
            }
        }
    }
    return {balance, amb_fee, eth_tx, amb_tx, validator_changes}
}

class PID {
    constructor(p, i, d, desired_total) {
        this.p = p
        this.i = i
        this.d = d
        this.desired_total = desired_total
        this.dt = 0.1

        this.pre_err = 0
        this.integral = 0
    }

    compute(feedback) {
        let err = this.desired_total - feedback
        this.integral += err * this.dt
        let derivative = (err - this.pre_err) / this.dt
        let output = (this.p * err + this.i * this.integral + this.d * derivative)

        this.pre_err = err
        return output
    }
}
