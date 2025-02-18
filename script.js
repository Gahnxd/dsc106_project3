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
    const width = 1400;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    svg.attr('width', width);
    svg.attr('height', height);

    let yValues = mouseData.avg;
    let currentCycle = [1];
    let currentMouse = ['avg'];

    const dropdownButton = document.getElementById('dropdown-button');
    const selectMouse = document.getElementById('select-mouse');
    const cycleBox = document.getElementById('cycle-buttons');

    let mouseOptions = ['avg', 'avg_fem', 'avg_male', 'f1', 'f2', 'f3', 'f4', 'f5',
        'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'm1', 'm2', 'm3', 'm4', 'm5',
        'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13'
    ]
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
        
        input.checked = (mouse === 'avg');
        
        input.onclick = function() {
            if (this.checked) {
                if (!currentMouse.includes(this.value)) {
                    currentMouse.push(this.value);
                }
            } else {
                currentMouse = currentMouse.filter(m => m !== this.value);
            }
            generateLines(currentCycle, currentMouse);
            updateSelectionDisplay();
        };
        
        label.textContent = getDisplayName(mouse);
        label.insertBefore(input, label.firstChild);
        selectMouse.appendChild(label);
    });

    updateSelectionDisplay();


    dropdownButton.addEventListener('click', function () {
        const dropdownContent = document.getElementById('select-mouse');
        if (dropdownButton.classList.contains('dropdown-open')) {
            dropdownButton.classList.remove('dropdown-open');
            dropdownButton.classList.add('dropdown-closed');
            dropdownContent.classList.remove('dropdown-visible');
            dropdownContent.classList.add('dropdown-hidden');
        } else {
            dropdownButton.classList.remove('dropdown-closed');
            dropdownButton.classList.add('dropdown-open');
            dropdownContent.classList.remove('dropdown-hidden');
            dropdownContent.classList.add('dropdown-visible');
        }
    });

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
        .domain([34.5, 39])
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
                                     `Cycle: ${i}<br>` +
                                     `Hour: ${formattedHour}:${formattedMinute}<br>` +
                                     `Temperature: ${temp.toFixed(2)}°C`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 10) + "px");
                    })
                    .on('mouseout', function () {
                        d3.select(this).attr('stroke-width', 1.5);
                        tooltip.style("opacity", 0);
                    });
            });
        });
    }

    generateLines([1], ['avg']);
}

window.addEventListener('load', () => {
    initializeVisualization().then(() => {
        const selectionDisplay = document.getElementById('current-selection');
        if (selectionDisplay) {
            updateSelectionDisplay();
        }
    });
});