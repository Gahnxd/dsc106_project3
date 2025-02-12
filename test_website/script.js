async function loadMouseData() {
    try {
        const response = await fetch('./mouse_data_new.json');
        const mouseData = await response.json();
        return mouseData;
    }   catch (error) {
        console.error('Error loading mouse data:', error);
    }
}

const mouseData = await loadMouseData();

const svg = d3.select('#mouse-plot');
const width = 1600;
const height = 800;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

svg.attr('width', width);
svg.attr('height', height);

// Initial data
let yValues = mouseData.avg;
let currentCycle = [1, 5, 9];

// Populate dropdown
let selectMouse = document.getElementById('select-mouse');
let cycleBox = document.getElementById('cycle-box');

let mouseOptions = ['avg', 'avg_fem', 'avg_male']
let cycleOptions = [1, 5, 9];

// add options to dropdown
mouseOptions.forEach((mouse) => {
    let option = document.createElement('option');
    option.text = mouse;
    selectMouse.add(option);
});

// add buttons for cycles
cycleOptions.forEach((cycle) => {
    let button = document.createElement('button');
    button.innerHTML = Math.floor(cycle/4) + 1;
    button.onclick = function() {
        if (currentCycle[0] == cycle && currentCycle.length == 1) {
            // Reset to initial state
            generateLines([1, 5, 9]);
            currentCycle = [1, 5, 9];
        } else {
            // Show only this cycle
            generateLines([cycle]);
            currentCycle = [cycle];
        }
    };
    cycleBox.appendChild(button);
});


// Create scales
const xScale = d3
  .scaleLinear()
  .domain([0, 4.1])
  .range([margin.left, width - margin.right]);

const yScale = d3
    .scaleLinear()
    .domain([35, 39])
    .range([height - margin.bottom, margin.top]);

// Create axes and labels
const xAxis = d3.axisBottom(xScale).ticks(4);
const yAxis = d3.axisLeft(yScale);

svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function generateLines(cycles){
    // reset svg
    d3.selectAll('.line').remove();
    cycles.forEach(cycle => {
        let i = cycle;

        // get indices for each cycle
        let indices = [];
        for (let j = 0; j < 4; j++) {
            mouseData.day.forEach((day, idx) => {
                if (day == i + j) {
                    indices.push(idx);
                }
            });
        }

        // get data from indices
        let data = [];
        indices.forEach((idx) => {
            data.push(yValues[idx]);
        });

        // generate line with data
        let line = d3.line()
            .x((d, i) => xScale(i/1440)) // 1440 minutes in a day
            .y(d => yScale(d));
        
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', colors(i))
            .attr('stroke-width', 1.5)
            .attr('d', line)
            .attr('class', 'line')
            .on('mouseover', function() {
                d3.select(this).attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke-width', 1.5);
            })
            .on('click', function() {
                if (currentCycle[0] == i && currentCycle.length == 1) {
                    // Reset to initial state
                    generateLines([1, 5, 9]);
                    currentCycle = [1, 5, 9];
                } else {
                    // Show only this cycle
                    generateLines([i]);
                    currentCycle = [i];
                }

            });

    });
}

// generate initial lines
generateLines([1, 5, 9]);

// Event listeners
selectMouse.addEventListener('change', function() {
    yValues = mouseData[this.value];
    generateLines(currentCycle);
});