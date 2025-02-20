async function loadMouseData() {
    try {
        const response = await fetch('./mouse_data.json');
        const mouseData = await response.json();
        return mouseData;
    } catch (error) {
        console.error('Error loading mouse data:', error);
    }
}

async function initializeVisualization() {
    const mouseData = await loadMouseData();

    const svg = d3.select('#mouse-plot');
    const width = 1250;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    svg.attr('width', width);
    svg.attr('height', height);

    let yValues = mouseData.avg;
    let currentCycle = [1];
    let currentMouse = ['avg'];

    const dropdownButtonAvg = document.getElementById('dropdown-button-avg');
    const dropdownButtonMale = document.getElementById('dropdown-button-male');
    const dropdownButtonFemale = document.getElementById('dropdown-button-female');
    const dropdownButtons = [dropdownButtonAvg, dropdownButtonMale, dropdownButtonFemale];
    const selectAvg = document.getElementById('select-avg');
    const selectMale = document.getElementById('select-male');
    const selectFemale = document.getElementById('select-female');
    const selectOptions = [selectAvg, selectMale, selectFemale];
    const cycleBox = document.getElementById('cycle-buttons');

    let mouseOptions = ['avg', 'avg_fem', 'avg_male', 'f1', 'f2', 'f3', 'f4', 'f5',
        'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'm1', 'm2', 'm3', 'm4', 'm5',
        'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13'
    ];
    let avgOptions = ['avg', 'avg_fem', 'avg_male'];
    let maleOptions = ['m1', 'm2', 'm3', 'm4', 'm5','m6', 
        'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13'
    ];
    let femaleOptions = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 
        'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13'
    ];

    let cycleOptions = [1, 5, 9];


    function getDisplayName(mouseId) {
        const displayNames = {
            'avg': 'Overall Average',
            'avg_fem': 'Average Female',
            'avg_male': 'Average Male',
        };

        if (mouseId.startsWith('m')) {
            const num = mouseId.substring(1);
            return `Male ${num}`;
        }
        if (mouseId.startsWith('f')) {
            const num = mouseId.substring(1);
            return `Female ${num}`;
        }

        return displayNames[mouseId] || mouseId;
    }

    function updateSelectionDisplay() {
        const selectionDisplay = document.getElementById('current-selection');
        if (!currentMouse || currentMouse.length === 0) {
            selectionDisplay.innerHTML = 'No mice selected';
            return;
        }

        const displayText = currentMouse
            .map(mouse => `<span>${getDisplayName(mouse)}</span>`)
            .join(' ');
        selectionDisplay.innerHTML = `Currently Selected: ${displayText}`;
    }

    mouseOptions.forEach((mouse) => {
        let label = document.createElement('label');
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.value = mouse;
        input.classList.add('mouse-option');
        label.id = 'label-' + mouse;
        
        input.checked = (mouse === 'avg');
        
        input.onclick = function() {
            if (this.checked) {
                if (!currentMouse.includes(this.value)) {
                    currentMouse.push(this.value);
                    label.classList.add('selected-label');
                }
            } else {
                currentMouse = currentMouse.filter(m => m !== this.value);
                label.classList.remove('selected-label');
            }
            generateLines(currentCycle, currentMouse);
            updateSelectionDisplay();
        };
        
        label.textContent = getDisplayName(mouse);
        label.insertBefore(input, label.firstChild);
        if (avgOptions.includes(mouse)) {
            selectAvg.appendChild(label);
        } else if (maleOptions.includes(mouse)) {   
            selectMale.appendChild(label);
        } else if (femaleOptions.includes(mouse)) {  
            selectFemale.appendChild(label);
        } else {
            console.log("Error: " + mouse + " not found in any category");
        }

        if (currentMouse.includes(mouse)) {
            label.classList.add('selected-label');
        }
    });

    updateSelectionDisplay();

    for (let i = 0; i < dropdownButtons.length; i++) {
        let button = dropdownButtons[i];
        let dropdownContent = selectOptions[i];
        button.addEventListener('click', function () {
            if (button.classList.contains('dropdown-open')) {
                button.classList.remove('dropdown-open');
                button.classList.add('dropdown-closed');
                dropdownContent.classList.remove('dropdown-visible');
                dropdownContent.classList.add('dropdown-hidden');
            } else {
                button.classList.remove('dropdown-closed');
                button.classList.add('dropdown-open');
                dropdownContent.classList.remove('dropdown-hidden');
                dropdownContent.classList.add('dropdown-visible');
            }
        });
    };

    cycleOptions.forEach((cycle) => {
        let button = document.createElement('button');
        button.classList.add(cycle === 1 ? 'selected-cycle' : 'cycle-button');
        button.innerHTML = "Cycle " + (Math.floor(cycle / 4) + 1);
        button.onclick = function () {
            if (currentCycle.includes(cycle)) {
                currentCycle = currentCycle.filter(c => c != cycle);
                generateLines(currentCycle, currentMouse);
                button.classList.remove('selected-cycle');
                button.classList.add('cycle-button');
            } else {
                currentCycle.push(cycle);
                generateLines(currentCycle, currentMouse);
                button.classList.remove('cycle-button');
                button.classList.add('selected-cycle');
            }
        };
        cycleBox.appendChild(button);
    });


    const xScale = d3
        .scaleLinear()
        .domain([0, 96])
        .range([margin.left, width - margin.right]);

    const yScale = d3
        .scaleLinear()
        .domain([34.5, 40])
        .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(xScale).tickValues(d3.range(0, 97, 6));
    const yAxis = d3.axisLeft(yScale);

    const xGrid = d3.axisBottom(xScale)
    .tickValues(d3.range(0, 97, 12))
    .tickSize(-height + margin.top + margin.bottom)
    .tickFormat('')

const yGrid = d3.axisLeft(yScale)
    .tickSize(-width + margin.left + margin.right)
    .tickFormat('')
    
    svg.append('g')
    .attr('class', 'grid x-grid')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xGrid);

svg.append('g')
    .attr('class', 'grid y-grid')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yGrid);


    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yAxis);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Hours")
        .attr("class", "xaxis-label");

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
    let mouseColor = {};
    mouseOptions.forEach((mouse, i) => {
        mouseColor[mouse] = i;
    });

    function generateLines(cycles, mouse = ['avg']) {
        d3.selectAll('.line').remove();

        mouse.forEach((m) => {
            yValues = mouseData[m];

            cycles.forEach(cycle => {
                let i = cycle;

                let indices = [];
                for (let j = 0; j < 4; j++) {
                    mouseData.day.forEach((day, idx) => {
                        if (day == i + j) {
                            indices.push(idx);
                        }
                    });
                }

                let data = [];
                indices.forEach((idx) => {
                    data.push(yValues[idx]);
                });

                let line = d3.line()
                    .x((d, i) => xScale(i / 60))
                    .y(d => yScale(d));

                svg.append('path')
                    .datum(data)
                    .attr('fill', 'none')
                    .attr('stroke', colors(i + mouseColor[m]))
                    .attr('stroke-width', 1.5)
                    .attr('d', line)
                    .attr('class', 'line')
                    .on('mouseover', function () {
                        d3.select(this).attr('stroke-width', 3);
                        tooltip.style("opacity", 1);
                    })
                    .on('mousemove', function (event) {
                        const [mouseX] = d3.pointer(event);
                        const minute = Math.floor(xScale.invert(mouseX) * 60);

                        const index = Math.min(Math.max(0, Math.floor(minute/60*60)), data.length - 1);
                        const temp = data[index];

                        const formattedMinute = `${String(minute % 60).padStart(2, '0')}`;
                        const formattedHour = `${String(Math.floor(minute / 60)).padStart(2, '0')}`;

                        tooltip.html(`Data: ${getDisplayName(m)}<br>` +
                                     `Cycle: ${(Math.floor(i / 4) + 1)}<br>` +
                                     `Hour: ${formattedHour}:${formattedMinute}<br>` +
                                     `Temperature: ${temp.toFixed(2)}°C`)
                            .style("left", (event.pageX - 70) + "px")
                            .style("top", (event.pageY + 15) + "px");
                    })
                    .on('mouseout', function () {
                        d3.select(this).attr('stroke-width', 1.5);
                        tooltip.style("opacity", 0);
                    });
            });
        });
    }

    generateLines([1], ['avg']);

    // Feature 2: Add reset button
    function addResetButton() {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset'; //'Reset to Overall Avg - Cycle 1';
        resetButton.classList.add('reset-button');

        resetButton.onclick = function () {
            // console.log("Reset button clicked!");
        
            currentMouse = ['avg']; // Reset to only Overall Average
            currentCycle = [1]; // Reset to only Cycle 1
        
            // Uncheck all checkboxes, check only 'avg'
            document.querySelectorAll('.mouse-option').forEach(input => {
                input.checked = input.value === 'avg';
            });
        
            // Update cycle selection buttons
            document.querySelectorAll('#cycle-buttons button').forEach(button => {
                if (button.textContent.includes('Cycle 1')) {
                    button.classList.add('selected-cycle');
                } else if (currentCycle.includes(parseInt(button.dataset.cycle))) {
                    button.classList.add('selected-cycle'); // Keep it selected if still in currentCycle
                } else {
                    button.classList.remove('selected-cycle'); // Deselect Cycle 2 & 3, but keep their style
                    button.classList.add('cycle-button'); // Ensure they retain their original style
                }
            });

            // Highlight 'Overall Average' label
            document.getElementById('label-avg').classList.add('selected-label');

            // Remove highlight from every other label
            document.querySelectorAll('.selected-label').forEach(label => {
                if (label.id !== 'label-avg') {
                    label.classList.remove('selected-label');
                }
            });

            
            updateSelectionDisplay();
            generateLines(currentCycle, currentMouse);
        };
        document.querySelector('.controls-container').appendChild(resetButton);
    }

    addResetButton();
}

window.addEventListener('load', () => {
    // initializeVisualization().then(() => {
    //     const selectionDisplay = document.getElementById('current-selection');
    //     if (selectionDisplay) {
    //         updateSelectionDisplay();
    //     }
    // });
    initializeVisualization();
});

// Feature 1: Add vertical lines for day/night separation with labels
function addDayNightLines(svg, width, height, margin, xScale) {
    const dayPeriods = [0, 24, 48, 72];    // Daytime start (in hours)
    const nightPeriods = [12, 36, 60, 84]; // Nighttime start (in hours)

    // Function to place lines accurately
    function placeLine(selection, data, color, dashArray = null) {
        selection
            .data(data)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('class', 'time-line')
            .attr('stroke-dasharray', dashArray ? '4,4' : 'none');
    }

    // Draw daytime lines (solid black)
    placeLine(svg.selectAll('.day-line'), dayPeriods, 'black');

    // Draw nighttime lines (dashed gray)
    placeLine(svg.selectAll('.night-line'), nightPeriods, 'gray', true);

    // Function to add labels
    function addLabels(selection, data, text, color) {
        selection
            .data(data)
            .enter()
            .append('text')
            .attr('x', d => xScale(d) + 5)
            .attr('y', margin.top - 10)
            .attr('fill', color)
            .attr('font-size', '12px')
            .attr('text-anchor', 'start')
            .text(text);
    }

    // Add labels for Day and Night periods
    addLabels(svg.selectAll('.day-label'), dayPeriods, 'Day Start', 'black');
    addLabels(svg.selectAll('.night-label'), nightPeriods, 'Night Start', 'gray');
}


// Feature 3: Click outside dropdown to close it
document.addEventListener('click', function (event) {
    document.querySelectorAll('.dropdown-button').forEach(button => {
        const dropdown = button.nextElementSibling;
        if (dropdown && !button.contains(event.target) && !dropdown.contains(event.target)) {
            button.classList.remove('dropdown-open');
            button.classList.add('dropdown-closed');
            dropdown.classList.remove('dropdown-visible');
            dropdown.classList.add('dropdown-hidden');
        }
    });
});

// Ensure features are added after visualization initializes
window.addEventListener('load', () => {
    const svg = d3.select('#mouse-plot');
    addDayNightLines(svg, 1400, 600, { top: 20, right: 20, bottom: 40, left: 60 }, d3.scaleLinear().domain([0, 96]).range([60, 1230]));
    // addResetButton();
});
