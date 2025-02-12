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
const width = 1200;
const height = 600;
const margin = { top: 20, right: 20, bottom: 40, left: 60 };

svg.attr('width', width);
svg.attr('height', height);

// Initial data & cycle selection
let yValues = mouseData.avg;
let currentCycle = [1, 5, 9];
let currentMouse = ['avg'];

// Populate selection dropdown and cycle buttons
const dropdownButton = document.getElementById('dropdown-button');
const selectMouse = document.getElementById('select-mouse');
const cycleBox = document.getElementById('cycle-buttons');

// Options for dropdown and buttons
let mouseOptions = ['avg', 'avg_fem', 'avg_male', 'm1', 'f1'] // TODO: Add more options
let cycleOptions = [1, 5, 9];

// Add options to dropdown
mouseOptions.forEach((mouse) => {
    let label = document.createElement('label');
    let input = document.createElement('input');
    label.textContent = mouse;
    input.type = 'checkbox';
    input.value = mouse;
    input.classList.add('mouse-option'); // Class: mouse-option
    input.onclick = function() {
        if (currentMouse.includes(this.value)) {
            // Remove this mouse
            currentMouse = currentMouse.filter(m => m != this.value);
            generateLines(currentCycle, currentMouse);
        } else {
            // Add this mouse
            currentMouse.push(this.value);
            generateLines(currentCycle, currentMouse);
        }
    };
    if (input.value == 'avg') {
        input.checked = true;
    }
    label.appendChild(input);
    selectMouse.appendChild(label);
});

// Add event listener to dropdown
dropdownButton.addEventListener('click', function() {
    // Show/hide dropdown
    document.getElementsByClassName('dropdown-hidden')[0].classList.toggle('dropdown-visible'); 
});

// Add buttons for cycles
cycleOptions.forEach((cycle) => {
    let button = document.createElement('button');
    button.classList.add('cycle-button'); // Class: cycle-button
    button.innerHTML = "Cycle " + (Math.floor(cycle/4) + 1); // Transform cycle as 1 to 4
    button.onclick = function() {
        if (currentCycle.includes(cycle)) {
            // Remove this cycle
            currentCycle = currentCycle.filter(c => c != cycle);
            generateLines(currentCycle, currentMouse    );
            
            // Change class to cycle-button
            button.classList.remove('selected-cycle');
            button.classList.add('cycle-button');
        } else {
            // Add this cycle
            currentCycle.push(cycle);
            generateLines(currentCycle, currentMouse);

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
  .domain([0, 96])
  .range([margin.left, width - margin.right]);

const yScale = d3
    .scaleLinear()
    .domain([35, 39])
    .range([height - margin.bottom, margin.top]);

// Create axes
const xAxis = d3.axisBottom(xScale).tickValues(d3.range(0, 97, 6)); // Every 6 hours
const yAxis = d3.axisLeft(yScale);

svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis);

// Add x-axis label
svg.append("text")
  .attr("x", width / 2)
  .attr("y", height)
  .attr("text-anchor", "middle")
  .attr("font-size", "14px")
  .text("Hours")
  .attr("class", "xaxis-label");

// Add y-axis label
svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 0)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Temperature (°C)")
    .attr("class", "yaxis-label");

let colors = d3.scaleOrdinal(d3.schemeTableau10);
// create a number dictionary for each mouse option
let mouseColor = {};
mouseOptions.forEach((mouse, i) => {
    mouseColor[mouse] = i;
});

function generateLines(cycles, mouse = ['avg']) {
    // Reset lines
    d3.selectAll('.line').remove();

    mouse.forEach((m) => {
        yValues = mouseData[m];

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
                .x((d, i) => xScale(i/60)) // 60 minutes in an hour
                .y(d => yScale(d));
            
            // Append line to SVG
            svg.append('path')
                .datum(data)
                .attr('fill', 'none')
                .attr('stroke', colors(i + mouseColor[m]))
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
                        generateLines([1, 5, 9], currentMouse);
                        currentCycle = [1, 5, 9];
                    } else {
                        // Show only this cycle
                        generateLines([i], currentMouse);
                        currentCycle = [i];
                    }

                });

        });
    });
}

// Generate initial lines
generateLines([1, 5, 9], ['avg']);

// Mouse selection dropdown event listener
// selectMouse.addEventListener('change', function() {
//     if (currentMouse.includes(this.value)) {
//         // Remove this mouse
//         currentMouse = currentMouse.filter(m => m != this.value);
//         generateLines(currentCycle, currentMouse);
//     } else {
//         // Add this mouse
//         currentMouse.push(this.value);
//         generateLines(currentCycle, currentMouse);
//     }
// });