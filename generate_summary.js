const XLSX = require("xlsx");
const fs = require("fs");

// =========================
// LOAD EXCEL
// =========================
console.log("📖 Membaca file Excel...");

const workbook = XLSX.readFile("organizations-500kkkkk.xlsx");
const sheet = workbook.Sheets["organizations-500k"];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`✅ Total rows: ${data.length}`);

// =========================
// HELPER FUNCTIONS
// =========================
function getTopValues(field, limit = 50) {
  const counts = {};

  data.forEach((row) => {
    const value = row[field];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, total]) => ({
      name,
      total,
    }));
}

// =========================
// EMPLOYEE ANALYSIS
// =========================
let minEmployees = Infinity;
let maxEmployees = 0;
let totalEmployees = 0;
let employeeCount = 0;

const employeeDistribution = {
  "1-50": 0,
  "51-200": 0,
  "201-500": 0,
  "501-1000": 0,
  "1001-5000": 0,
  "5001+": 0,
};

data.forEach((row) => {
  const emp = Number(row["Number of employees"]);

  if (isNaN(emp)) return;

  minEmployees = Math.min(minEmployees, emp);
  maxEmployees = Math.max(maxEmployees, emp);

  totalEmployees += emp;
  employeeCount++;

  if (emp <= 50) {
    employeeDistribution["1-50"]++;
  } else if (emp <= 200) {
    employeeDistribution["51-200"]++;
  } else if (emp <= 500) {
    employeeDistribution["201-500"]++;
  } else if (emp <= 1000) {
    employeeDistribution["501-1000"]++;
  } else if (emp <= 5000) {
    employeeDistribution["1001-5000"]++;
  } else {
    employeeDistribution["5001+"]++;
  }
});

const employeeDistributionArray = Object.entries(
  employeeDistribution
).map(([category, total]) => ({
  category,
  total,
}));

const largestEmployeeCategory =
  [...employeeDistributionArray]
    .sort((a, b) => b.total - a.total)[0]
    ?.category || null;

// =========================
// FOUNDED ANALYSIS
// =========================
let oldestFoundedYear = Infinity;
let newestFoundedYear = 0;
let foundedTotal = 0;
let foundedCount = 0;

data.forEach((row) => {
  const founded = Number(row["Founded"]);

  if (isNaN(founded)) return;

  oldestFoundedYear = Math.min(
    oldestFoundedYear,
    founded
  );

  newestFoundedYear = Math.max(
    newestFoundedYear,
    founded
  );

  foundedTotal += founded;
  foundedCount++;
});

const averageFoundedYear =
  foundedCount > 0
    ? Math.round(foundedTotal / foundedCount)
    : null;

// =========================
// TOP COUNTRIES
// =========================
const topCountries = getTopValues(
  "Country",
  50
);

const dominantCountry =
  topCountries.length > 0
    ? topCountries[0].name
    : null;

// =========================
// TOP INDUSTRIES
// =========================
const topIndustries = getTopValues(
  "Industry",
  50
);

const dominantIndustry =
  topIndustries.length > 0
    ? topIndustries[0].name
    : null;

// =========================
// BUILD SUMMARY
// =========================
const summary = {
  metadata: {
    totalOrganizations: data.length,
    generatedAt: new Date().toISOString(),
  },

  executiveSummary: {
    overview: `Dataset berisi ${data.length} organisasi global.`,

    dominantCountry,

    dominantIndustry,

    largestEmployeeCategory,

    averageFoundedYear,

    keyInsight:
      `Mayoritas organisasi berada pada kategori ${largestEmployeeCategory}. ` +
      `Industri yang paling dominan adalah ${dominantIndustry}. ` +
      `Rata-rata organisasi berdiri pada tahun ${averageFoundedYear}.`
  },

  datasetInsights: {
    dominantCountry,
    dominantIndustry,
    largestEmployeeCategory,
    averageFoundedYear,
  },

  countries: {
    top50: topCountries,
  },

  industries: {
    top50: topIndustries,
  },

  employees: {
    minEmployees,
    maxEmployees,

    averageEmployees:
      employeeCount > 0
        ? Math.round(
            totalEmployees /
              employeeCount
          )
        : 0,

    distribution:
      employeeDistributionArray,
  },

  founded: {
    oldestFoundedYear:
      oldestFoundedYear === Infinity
        ? null
        : oldestFoundedYear,

    newestFoundedYear:
      newestFoundedYear === 0
        ? null
        : newestFoundedYear,

    averageFoundedYear,
  },
};

// =========================
// SAVE FILE
// =========================
fs.writeFileSync(
  "dataset_summary.json",
  JSON.stringify(summary, null, 2)
);

console.log(
  "✅ dataset_summary.json berhasil dibuat!"
);

console.log(
  "📊 Ringkasan Dataset:"
);

console.log(
  `Total Organizations : ${summary.metadata.totalOrganizations}`
);

console.log(
  `Dominant Country    : ${summary.datasetInsights.dominantCountry}`
);

console.log(
  `Dominant Industry   : ${summary.datasetInsights.dominantIndustry}`
);

console.log(
  `Largest Employee Category : ${summary.datasetInsights.largestEmployeeCategory}`
);

console.log(
  `Average Founded Year : ${summary.datasetInsights.averageFoundedYear}`
);