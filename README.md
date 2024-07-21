# How (un)popular your first name has become over time

**What I aimed to accomplish**:\
I wanted to build an interactive chart with D3 and JavaScript, which allows users to compare the popularity of their first name with other names over time. This can lead to interesting comparisons and various insights.

**Findings**:\
For example, I found out that John was the most common name until 1923. In 1880, one in twelve boys was named John. In comparison, in 2020, the most common girl’s name was Olivia, but only one in 108 girls received this name. It is also interesting that most of the names of my family and friends were in trend or peaked at the time they were born. This indicates that most people choose names for their children that are currently in trend. For example, my name, Patrick, was at its second peak in my birth year, 1985. However, today it is rarely given.

There are also amusing facts that can be discovered using the chart. For instance, in 2002, 705 girls were named «America».

**Data collection**:\
The data I used:
- combined_babynames.csv: <a href="https://catalog.data.gov/dataset/baby-names-from-social-security-card-applications-national-data">Baby Names from Social Security Card Applications - National Data</a>. The data (name, year of birth, sex, and number) are from a 100 percent sample of Social Security card applications for 1880 onward.

**Data analysis**:\
For each year, there is a text file with the names from that year. To perform analyses over time, I first had to merge all the files into a single file (combined_babynames.csv). My interactive line chart is intended to show the relative frequency of each boy’s and girl’s name over the years. I calculated the corresponding additional column with the percentage share in a Jupyter Notebook using Python and Pandas based on the frequency. Additionally, I needed a column with the name and gender combined, e.g., Andrea (M) or Andrea (F), which allows for differentiation by gender in the search field.

**Summary, Challenges, Skills**:\
Building a chart with D3 was a challenge for me. Adding interactivity was an additional difficulty. Implementing functionalities such as a tooltip, as well as meeting the design and usability requirements, took a lot of time. This includes, for example, disabling the name search when the maximum number of selected names is reached. I also had to implement a filtering logic that ignores the last three characters of each name because these characters indicate the gender (M, F) in brackets and are only there for differentiation. Additionally, I encountered performance problems when loading all names as search results, so I resolved this by displaying only the first 50 names.

With this project, I was able to practice using D3 and JavaScript extensively.
