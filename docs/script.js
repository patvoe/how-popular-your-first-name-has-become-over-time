let allData = [];
let allNames = []; // Array to store all unique names
let selectedNames = ["John (M)", "Olivia (F)"]; // Default selected names
const defaultXDomain = [1880, 2023];
const defaultYDomain = [0, 6]; // Example default range for y-axis

function loadData() {
  return d3.csv("./assets/data_minified.csv").then((data) => {
    allData = data.map((d) => ({
      Name: d.name_with_gender.trim(),
      Year: +d.Year, // Make sure Year is properly parsed as a number
      Count: +d.share_percent, // Ensure Count is properly parsed as a number
    }));
    allNames = Array.from(new Set(allData.map((d) => d.Name))); // Populate allNames with unique names
    displayChart(selectedNames); // Display chart for default names
    addSelectedNameButtons(); // Add buttons for default names
  });
}

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const mouseG = d3
  .select("body")
  .append("g")
  .attr("class", "mouse-over-effects");

function showTooltip(event, data, names, colors) {
  tooltip.transition().duration(100).style("opacity", 0.9);

  const year = data.Year;
  const values = names
    .map((name, index) => ({
      name,
      count: data.Count[index],
      color: colors[index],
    }))
    .sort((a, b) => b.count - a.count)
    .map(
      (v) =>
        `<span style="color:${v.color};">${v.name}: ${v.count.toFixed(
          5
        )}%</span>`
    )
    .join("<br/>");

  const tooltipHtml = `<b class="Number">${year}</b>${values}`;

  tooltip
    .html(tooltipHtml)
    .style(
      "left",
      (year > 1940
        ? event.pageX - tooltip.node().offsetWidth - 15
        : event.pageX + 15) + "px"
    )
    .style("top", event.pageY - 28 + "px");
}

function hideTooltip() {
  tooltip.transition().duration(500).style("opacity", 0);
}

function filterNames(query) {
  const uniqueNames = new Set();
  allData.forEach((d) => {
    if (d.Name.toLowerCase().includes(query.toLowerCase())) {
      uniqueNames.add(d.Name);
    }
  });
  return Array.from(uniqueNames);
}

function displayResults(results) {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = "";

  const list = document.createElement("ul");
  const itemHeight = 30; // Approximate height of each list item
  const visibleItemsCount = Math.ceil(
    resultsContainer.clientHeight / itemHeight
  );

  let scrollTop = 0;
  resultsContainer.addEventListener("scroll", () => {
    scrollTop = resultsContainer.scrollTop;
    renderList();
  });

  function renderList() {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItemsCount, results.length);

    list.innerHTML = "";
    for (let i = startIndex; i < endIndex; i++) {
      const listItem = document.createElement("li");
      listItem.textContent = results[i];
      listItem.addEventListener("click", () => {
        if (selectedNames.length < 2 && !selectedNames.includes(results[i])) {
          selectedNames.push(results[i]);
          displayChart(selectedNames);
          addSelectedNameButtons();
        }
        resultsContainer.style.display = "none";
      });
      list.appendChild(listItem);
    }
  }

  resultsContainer.appendChild(list);
  renderList();
  resultsContainer.style.display = "block";
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function addSelectedNameButtons() {
  const selectedNameContainer = document.getElementById(
    "selectedNameContainer"
  );
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
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent the main button click event
      selectedNames = selectedNames.filter((n) => n !== name);
      displayChart(selectedNames);
      addSelectedNameButtons();
    });

    button.appendChild(buttonText);
    button.appendChild(closeButton);

    button.addEventListener("click", () => {
      // Optional: Do something when the main part of the button is clicked
    });

    selectedNameContainer.appendChild(button);
  });
}

function displayChart(names) {
  const years = d3.range(1880, 2024); // Example range from 1880 to 2024

  const nameData = names.map((name) => {
    const data = allData.filter((d) => d.Name === name);
    const dataMap = new Map(data.map((d) => [d.Year, d]));
    return years.map((year) => ({
      Year: year,
      Count: dataMap.get(year) ? dataMap.get(year).Count : 0, // Use 0 if no data for that year
    }));
  });

  const margin = { top: 20, right: 15, bottom: 30, left: 68 };
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
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")))
    .classed("axis text", true)
    .style("font-size", "14px")
    .style("font-family", "'IBM Plex Sans', sans-serif");

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
    .attr("dx", "-5") // Move text x pixels to the left
    .filter((d) => d === 0) // Filter out the 0 tick text
    .remove();

  chart.append("g").attr("class", "y axis-grid").call(
    d3
      .axisLeft(y)
      .ticks(4) // Customize the number of y-ticks here
      .tickSize(-width)
      .tickFormat("")
  );

  // Remove y-axis and x-axis tick lines and domain
  chart.selectAll(".domain").remove();

  // Add solid 0 x-axis line
  chart
    .append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "black")
    .attr("stroke-width", 1);

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
    .on("mousemove", function (event) {
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
        return "translate(" + x(yearData.Year) + "," + y(count) + ")";
      });

      const year = nameData[0][idx].Year;
      const values = nameData.map((d, i) => ({
        name: names[i],
        count: d[idx] ? d[idx].Count : 0,
        color: colors[i],
      }));

      showTooltip(
        event,
        { Year: year, Count: values.map((v) => v.count) },
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

document.getElementById("nameInput").addEventListener(
  "input",
  debounce(function () {
    const query = this.value;
    const filteredNames = filterNames(query);
    displayResults(filteredNames);
  }, 300)
);

document.getElementById("nameInput").addEventListener("focus", function () {
  displayResults(allNames); // Display all names on focus if input is empty
  document.getElementById("searchResults").style.display = "block";
});

loadData();

document.addEventListener("click", function (event) {
  const nameInput = document.getElementById("nameInput");
  const searchResults = document.getElementById("searchResults");
  const isClickInside =
    nameInput.contains(event.target) || searchResults.contains(event.target);

  if (!isClickInside) {
    searchResults.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", (event) => {
  const nameInput = document.getElementById("nameInput");
  const searchResults = document.getElementById("searchResults");

  document.addEventListener("click", function (event) {
    const isClickInside =
      nameInput.contains(event.target) || searchResults.contains(event.target);

    if (!isClickInside) {
      searchResults.style.display = "none";
    }
  });

  nameInput.addEventListener("focus", function () {
    if (nameInput.value) {
      const filteredNames = filterNames(nameInput.value);
      displayResults(filteredNames);
    } else {
      displayResults(allNames);
    }
    searchResults.style.display = "block";
  });

  nameInput.addEventListener("input", function () {
    const query = this.value;
    const filteredNames = filterNames(query);
    displayResults(filteredNames);
  });
});

function filterNames(query) {
  const uniqueNames = new Set();
  allData.forEach((d) => {
    if (d.Name.toLowerCase().includes(query.toLowerCase())) {
      uniqueNames.add(d.Name);
    }
  });
  return Array.from(uniqueNames);
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
