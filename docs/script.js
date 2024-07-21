let allData = [];
let allNames = []; // Array to store all unique names
let filteredNamesCache = {}; // Cache for filtered names
let selectedNames = ["John (M)", "Olivia (F)"]; // Default selected names
let dataLoaded = false; // Flag to check if data is loaded

const defaultXDomain = [1880, 2023];
const defaultYDomain = [0, 6]; // Example default range for y-axis

function loadData() {
  return d3.csv("./assets/data_minified.csv").then((data) => {
    allData = data.map((d) => ({
      Name: d.name_with_gender.trim(),
      Year: +d.Year, // Make sure Year is properly parsed as a number
      Count: +d.share_percent, // Ensure Count is properly parsed as a number
      AbsoluteCount: +d.Count,
    }));
    allNames = Array.from(new Set(allData.map((d) => d.Name))); // Populate allNames with unique names
    console.log("Data loaded:", allData); // Debug statement
    console.log("All names:", allNames); // Debug statement
    dataLoaded = true; // Set flag to true once data is loaded
    displayChart(selectedNames); // Display chart for default names
    addSelectedNameButtons(); // Add buttons for default names
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadData(); // Load data once when the DOM is fully loaded

  const nameInput = document.getElementById("nameInput");
  const searchResults = document.getElementById("searchResults");

  nameInput.addEventListener(
    "input",
    debounce(function () {
      if (!dataLoaded) return; // If data is not loaded, return
      showLoadingText();
      const query = this.value.toLowerCase();
      setTimeout(() => {
        // Simulate loading delay
        if (query) {
          filteredNamesCache = filterNames(query);
          console.log("Filtered names:", filteredNamesCache); // Debug statement
          displayResults(filteredNamesCache);
        } else {
          displayResults(allNames.slice(0, 30)); // Display a subset of names when input is empty
        }
        hideLoadingText();
      }, 200); // Adjusted this delay to 200ms
    }, 300)
  );

  nameInput.addEventListener("focus", function () {
    if (!dataLoaded) return; // If data is not loaded, return
    showLoadingText();
    setTimeout(() => {
      // Simulate loading delay
      const query = nameInput.value.toLowerCase();
      if (query) {
        displayResults(filteredNamesCache[query] || []);
      } else {
        displayResults(allNames.slice(0, 30)); // Display a subset of names initially
      }
      hideLoadingText();
    }, 200); // Adjusted this delay to 200ms
    searchResults.style.display = "block";
  });

  document.addEventListener("click", (event) => {
    const isClickInside =
      nameInput.contains(event.target) || searchResults.contains(event.target);

    if (!isClickInside) {
      searchResults.style.display = "none";
    }
  });
});

function filterNames(query) {
  const lowerCaseQuery = query.toLowerCase();
  if (filteredNamesCache[lowerCaseQuery]) {
    return filteredNamesCache[lowerCaseQuery];
  }
  const filteredNames = allNames.filter(name => {
    const nameWithoutLastThree = name.slice(0, -3).toLowerCase();
    return nameWithoutLastThree.includes(lowerCaseQuery);
  });
  filteredNamesCache[lowerCaseQuery] = filteredNames;
  return filteredNames;
}

function displayResults(results) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";
  const list = document.createElement("ul");
  results.forEach((name) => {
    const listItem = document.createElement("li");
    listItem.textContent = name;
    listItem.addEventListener("click", () => {
      if (selectedNames.length < 2 && !selectedNames.includes(name)) {
        selectedNames.push(name);
        displayChart(selectedNames);
        addSelectedNameButtons();
      }
      resultsContainer.style.display = "none";
    });
    list.appendChild(listItem);
  });
  resultsContainer.appendChild(list);
  resultsContainer.style.display = "block";
}

function addSelectedNameButtons() {
  const selectedNameContainer = document.getElementById(
    "selectedNameContainer"
  );
  const nameInput = document.getElementById("nameInput");
  selectedNameContainer.innerHTML = "";

  selectedNames.forEach((name) => {
    const button = document.createElement("button");
    button.className = "selected-name-button";

    const buttonText = document.createElement("span");
    buttonText.textContent = name;

    const closeButton = document.createElement("span");
    closeButton.textContent = " x";
    closeButton.style.marginLeft = "8px";
    closeButton.style.cursor = "pointer";

    button.appendChild(buttonText);
    button.appendChild(closeButton);

    // Add event listener to remove the name on button click
    button.addEventListener("click", () => {
      selectedNames = selectedNames.filter((n) => n !== name);
      displayChart(selectedNames);
      addSelectedNameButtons();
      nameInput.disabled = false; // Re-enable the input field
      nameInput.classList.remove("faded-out"); // Remove faded-out effect
    });

    selectedNameContainer.appendChild(button);
  });

  // Update the placeholder text based on the length of selectedNames
  if (selectedNames.length == 2) {
    nameInput.placeholder =
      "Max. of 2 names selected (Delete one to add another)";
    nameInput.disabled = true; // Disable the input field
    nameInput.classList.add("faded-out"); // Add faded-out effect
  } else {
    nameInput.placeholder = "Search for a name...";
    nameInput.disabled = false; // Enable the input field
    nameInput.classList.remove("faded-out"); // Remove faded-out effect
  }
}

function displayChart(names) {
  const years = d3.range(1880, 2024); // Example range from 1880 to 2024

  const nameData = names.map((name) => {
    const data = allData.filter((d) => d.Name === name);
    const dataMap = new Map(data.map((d) => [d.Year, d]));
    return years.map((year) => ({
      Year: year,
      Count: dataMap.get(year) ? dataMap.get(year).Count : 0, // Use 0 if no data for that year
      AbsoluteCount: dataMap.get(year) ? dataMap.get(year).AbsoluteCount : 0,
    }));
  });

  const margin = { top: 47, right: 14, bottom: 30, left: 70 };
  const width =
    document.querySelector(".chart-container").clientWidth -
    margin.left -
    margin.right;
  const height =
    document.querySelector(".chart-container").clientHeight -
    margin.top -
    margin.bottom;

  let svg = d3.select("#chart").select("svg");
  if (svg.empty()) {
    svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr(
        "viewBox",
        `0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`
      )
      .attr("preserveAspectRatio", "xMidYMid meet");
  }

  svg.selectChildren().remove();

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const allYears = nameData.flat().map((d) => d.Year);
  const allCounts = nameData.flat().map((d) => d.Count);

  const xDomain = allYears.length > 0 ? d3.extent(allYears) : defaultXDomain;
  const yDomain =
    allCounts.length > 0 ? [0, d3.max(allCounts)] : defaultYDomain;

  const x = d3.scaleLinear().domain(xDomain).range([0, width]);
  const y = d3.scaleLinear().domain(yDomain).nice().range([height, 0]);

  const line = d3
    .line()
    .defined((d) => d.Count !== null)
    .x((d) => x(d.Year))
    .y((d) => y(d.Count));

  chart
    .append("g")
    .attr("class", "x axis-grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(4).tickSize(0).tickFormat(d3.format("d")))
    .classed("x axis text", true)
    .style("font-size", "14px")
    .style("font-family", "'IBM Plex Sans', sans-serif");

  chart
    .selectAll("text")
    .attr("class", "x axis text")
    .attr("dy", "1.25em") // Move the text down
    .style("color", "#7D7D7D");

  chart
    .selectAll("g.tick")
    .append("line")
    .classed("grid-line", true)
    .attr("stroke", "#d4d4d4") // Adjust the color of the grid lines if needed
    .attr("y1", -height)
    .attr("y2", 0)
    .attr("x1", 0)
    .attr("stroke-width", "0.75");
  // .attr("stroke-dasharray", "4,2");

  // Custom function to draw y-axis grid lines extended to the left
  function drawYAxis(g) {
    g.call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(""));
    g.selectAll(".tick line")
      .attr("x1", -margin.left) // Extend the grid lines to the left
      .attr("stroke", "#d4d4d4") // Adjust the color of the grid lines if needed
      // .attr("stroke-dasharray", "4,2");
      .attr("stroke-width", "0.75");
  }

  chart.append("g").attr("class", "y axis-grid").call(drawYAxis);

  chart
    .append("g")
    .attr("class", "y axis-grid")
    .call(
      d3
        .axisLeft(y)
        .ticks(4)
        .tickSize(0)
        .tickFormat((d) => d + "%")
    ) // Add percent symbol
    .selectAll("text")
    .classed("axis text", true)
    .style("font-size", "14px")
    .style("font-family", "'IBM Plex Sans', sans-serif")
    .attr("text-anchor", "start")
    .attr("dx", -margin.left + 5) // Move text x pixels to the left
    .attr("dy", "-.5em") // Move text up above the tick lines
    .filter((d) => d === 0) // Filter out the 0 tick text
    .remove();

  // Add the y-axis label above the first tick
  chart
    .append("text")
    .attr("class", "y axis-label")
    .attr("text-anchor", "start")
    .attr("x", -margin.left)
    .style("fill", "#7D7D7D")
    .attr("y", -37) // Adjust this value to move the label as needed
    .text("↑ share of male/female baby names");

  // Add the text " of men" to the last y-axis tick
  // Update the text of the last y-axis tick to include " of men"

  // chart
  //   .select(".y.axis-grid .tick:last-of-type text")
  //   .style("font-size", "12px")
  //   .style("font-family", "'IBM Plex Sans', sans-serif")
  //   .attr("text-anchor", "start")
  //   .attr("dx", -margin.left + 72) // Move text x pixels to the left
  //   .attr("dy", "-.5em") // Move text up above the tick lines
  //   .text(function (d) {
  //     return "of men/woman";
  //   });

  // chart.append("g").attr("class", "y axis-grid").call(
  //   d3
  //     .axisLeft(y)
  //     .ticks(4) // Customize the number of y-ticks here
  //     .tickSize(-width - margin.left) // Extend the grid lines to the left edge
  //     .tickFormat("")
  // );

  // Remove y-axis and x-axis tick lines and domain
  chart.selectAll(".domain").remove();

  // Add solid 0 x-axis line
  chart
    .append("line")
    .attr("x1", -margin.left)
    .attr("x2", width)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#7D7D7D")
    .attr("stroke-width", 1.25);

  const colors = ["#A757A3", "#2CA29F"];

  const lines = chart
    .selectAll(".line-group")
    .data(nameData)
    .enter()
    .append("g")
    .attr("class", "line-group");

  lines
    .append("path")
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", (d, i) => colors[i]);

  const mouseG = chart.append("g").attr("class", "mouse-over-effects");

  mouseG
    .append("path") // this is the black vertical line to follow mouse
    .attr("class", "mouse-line")
    .style("stroke", "black")
    .style("stroke-width", "1px")
    .style("stroke-dasharray", "3,3")
    .style("opacity", "0");

  const mousePerLine = mouseG
    .selectAll(".mouse-per-line")
    .data(nameData)
    .enter()
    .append("g")
    .attr("class", "mouse-per-line");

  mousePerLine
    .append("circle")
    .attr("r", 7)
    .style("stroke", (d, i) => colors[i])
    .style("fill", "none")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  mousePerLine.append("text").attr("transform", "translate(10,3)");

  mouseG
    .append("svg:rect") // append a rect to catch mouse movements on canvas
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseout", function () {
      // on mouse out hide line, circles and text
      d3.select(".mouse-line").style("opacity", "0");
      d3.selectAll(".mouse-per-line circle").style("opacity", "0");
      d3.selectAll(".mouse-per-line text").style("opacity", "0");
      hideTooltip();
    })
    .on("mouseover", function () {
      // on mouse in show line, circles and text
      d3.select(".mouse-line").style("opacity", "1");
      d3.selectAll(".mouse-per-line circle").style("opacity", "1");
      d3.selectAll(".mouse-per-line text").style("opacity", "1");
    })
    .on("mousemove touchmove", function (event) {
      // mouse moving over canvas
      const mouse = d3.pointer(event);
      const xDate = x.invert(mouse[0]);
      const bisect = d3.bisector((d) => d.Year).left;
      const idx = bisect(nameData[0], xDate);

      d3.select(".mouse-line").attr("d", function () {
        let d = "M" + x(nameData[0][idx].Year) + "," + height;
        d += " " + x(nameData[0][idx].Year) + "," + 0;
        return d;
      });

      d3.selectAll(".mouse-per-line").attr("transform", function (d, i) {
        const yearData = d[idx];
        const count = yearData ? yearData.Count : 0;
        const absoluteCount = yearData ? yearData.AbsoluteCount : 0;
        return "translate(" + x(yearData.Year) + "," + y(count) + ")";
      });

      const year = nameData[0][idx].Year;
      const values = nameData.map((d, i) => ({
        name: names[i],
        count: d[idx] ? d[idx].Count : 0,
        absolute: d[idx] ? d[idx].AbsoluteCount : 0,
        color: colors[i],
      }));

      showTooltip(
        event,
        {
          Year: year,
          Count: values.map((v) => v.count),
          AbsoluteCount: values.map((v) => v.absolute),
        },
        values.map((v) => v.name),
        colors
      );
    });

  lines
    .selectAll("circle")
    .data((d, i) => d.map((point) => ({ ...point, color: colors[i] })))
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.Year))
    .attr("cy", (d) => y(d.Count))
    .attr("r", 3)
    .attr("fill", "transparent")
    .on("mouseover", function (event, d) {
      showTooltip(event, d, selectedNames, colors);
    })
    .on("mouseout", hideTooltip);
}

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("display", "none");

const mouseG = d3
  .select("body")
  .append("g")
  .attr("class", "mouse-over-effects");

function showTooltip(event, data, names, colors) {
  tooltip.transition().duration(100).style("opacity", 0.9).style("display", "block");

  const year = data.Year;
  const values = names
    .map((name, index) => ({
      name,
      count: data.Count[index],
      absolute: data.AbsoluteCount[index],
      color: colors[index],
    }))
    .sort((a, b) => b.count - a.count)
    .map(
      (v) =>
        `<tr>
          <td style="color:${
            v.color
          }; vertical-align: top; white-space: nowrap;">${v.name}:</td>
          <td style="display: flex; flex-direction: row; align-items: baseline; color:${
            v.color
          }; flex-wrap: wrap;">
            <div style="flex: 1;"><b>${v.count.toFixed(5)}%</b>&nbsp;</div>
            <div style="flex: 1;" class="smallNumber">abs.&nbsp;${v.absolute
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
          </td>
        </tr>`
    )
    .join("");

  const tooltipHtml = `<b class="Number">${year}</b><table>${values}</table>`;

  tooltip
    .html(tooltipHtml)
    .style(
      "left",
      (year > 1940
        ? event.pageX - tooltip.node().offsetWidth - 16
        : event.pageX + 16) + "px"
    )
    .style("top", event.pageY - 28 + "px");
}
function hideTooltip() {
  tooltip.transition().duration(500).style("opacity", 0);
}
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function showLoadingText() {
  const nameInput = document.getElementById("nameInput");
  nameInput.placeholder = "Loading...";
}
function hideLoadingText() {
  const nameInput = document.getElementById("nameInput");
  nameInput.placeholder = "Search for a name...";
}
