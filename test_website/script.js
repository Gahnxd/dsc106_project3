// Function for loading mouse data from JSON file
async function loadMouseData() {
    try {
        const response = await fetch('./mouse_data_test.json'); // change to correct path
        const mouseData = await response.json();
        return mouseData;
    }   catch (error) {
        console.error('Error loading mouse data:', error);
    }
}

// Load data
const mouseData = await loadMouseData();

// Create SVG element
const svg = d3.select('#mouse-plot');
const width = 1600;
const height = 800;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

svg.attr('width', width);
svg.attr('height', height);

// Initial data & cycle selection
let yValues = mouseData.avg;
let currentCycle = [1, 5, 9];

// Populate selection dropdown and cycle buttons
let selectMouse = document.getElementById('select-mouse');
let cycleBox = document.getElementById('cycle-buttons');

// Options for dropdown and buttons
let mouseOptions = ['avg', 'avg_fem', 'avg_male']
let cycleOptions = [1, 5, 9];

// Add options to dropdown
mouseOptions.forEach((mouse) => {
    let option = document.createElement('option');
    option.text = mouse;
    option.classList.add('mouse-option'); // Class: mouse-option
    selectMouse.add(option);
});

// Add buttons for cycles
cycleOptions.forEach((cycle) => {
    let button = document.createElement('button');
    button.classList.add('cycle-button'); // Class: cycle-button
    button.innerHTML = Math.floor(cycle/4) + 1; // Transform cycle as 1 to 4
    button.onclick = function() {
        if (currentCycle.includes(cycle)) {
            // Remove this cycle
            currentCycle = currentCycle.filter(c => c != cycle);
            generateLines(currentCycle);
            
            // Change class to cycle-button
            button.classList.remove('selected-cycle');
            button.classList.add('cycle-button');
        } else {
            // Add this cycle
            currentCycle.push(cycle);
            generateLines(currentCycle);

            // Change class to selected-cycle
            button.classList.remove('cycle-button');
            button.classList.add('selected-cycle');
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

// Create axes
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
    // Reset lines
    d3.selectAll('.line').remove();

    // Generate lines for each cycle
    cycles.forEach(cycle => {
        let i = cycle;

        // Get indices for each cycle
        let indices = [];
        for (let j = 0; j < 4; j++) {
            mouseData.day.forEach((day, idx) => {
                if (day == i + j) {
                    indices.push(idx);
                }
            });
        }

        // Get data from indices
        let data = [];
        indices.forEach((idx) => {
            data.push(yValues[idx]);
        });

        // Generate line with data
        let line = d3.line()
            .x((d, i) => xScale(i/1440)) // 1440 minutes in a day
            .y(d => yScale(d));
        
        // Append line to SVG
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', colors(i))
            .attr('stroke-width', 1.5)
            .attr('d', line)
            .attr('class', 'line')
            .on('mouseover', function() {
                // Highlight line on mouseover
                d3.select(this).attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                // Reset line on mouseout
                d3.select(this).attr('stroke-width', 1.5);
            })
            .on('click', function() {
                if (currentCycle.length == 1 && currentCycle[0] == i) {
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

// Generate initial lines
generateLines([1, 5, 9]);

// Mouse selection dropdown event listener
selectMouse.addEventListener('change', function() {
    yValues = mouseData[this.value];
    generateLines(currentCycle);
});