type CountryPopulation = {
  rank: number;
  country: string;
  population_count: number;
  estimate_year: number;
};

const populationFormatter = new Intl.NumberFormat("en-US");

export const dynamic = "force-dynamic";

async function getCountryPopulations(): Promise<CountryPopulation[]> {
  const projectUrl = process.env.supabase_project_url;
  const anonKey = process.env.supabase_anon_key;

  if (!projectUrl || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const endpoint = new URL(
    "/rest/v1/most_populous_countries",
    projectUrl.endsWith("/") ? projectUrl : `${projectUrl}/`,
  );
  endpoint.searchParams.set(
    "select",
    "rank,country,population_count,estimate_year",
  );
  endpoint.searchParams.set("order", "rank.asc");

  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase returned HTTP ${response.status}.`);
  }

  return (await response.json()) as CountryPopulation[];
}

export default async function Home() {
  let countries: CountryPopulation[] = [];
  let loadFailed = false;

  try {
    countries = await getCountryPopulations();
  } catch (error) {
    loadFailed = true;
    console.error("Could not load country population data.", error);
  }

  const estimateYear = countries[0]?.estimate_year ?? 2026;

  return (
    <main className="population-page">
      <div className="page-frame">
        <header className="page-heading">
          <p className="eyebrow">WORLD POPULATION / {estimateYear}</p>
          <h1>Countries by population</h1>
          <p className="page-intro">
            The 15 most populous countries, ranked by estimated population.
          </p>
        </header>

        <section className="population-section" aria-labelledby="ranking-title">
          <div className="section-heading">
            <div>
              <h2 id="ranking-title">Population ranking</h2>
              <p>Counts rounded to the nearest million</p>
            </div>
            <span className="row-count">
              {loadFailed
                ? "Unavailable"
                : `${countries.length.toString().padStart(2, "0")} countries`}
            </span>
          </div>

          {loadFailed ? (
            <div className="notice" role="alert">
              <h3>Population data is unavailable right now.</h3>
              <p>Please try again in a little while.</p>
            </div>
          ) : countries.length === 0 ? (
            <div className="notice" role="status">
              <h3>No population records found.</h3>
              <p>There are no countries to display yet.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="population-table">
                <thead>
                  <tr>
                    <th scope="col" className="rank-column">
                      Rank
                    </th>
                    <th scope="col">Country</th>
                    <th scope="col" className="population-column">
                      Population
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country) => (
                    <tr key={country.rank}>
                      <td className="rank-cell">
                        {country.rank.toString().padStart(2, "0")}
                      </td>
                      <th scope="row" className="country-cell">
                        {country.country}
                      </th>
                      <td className="population-cell">
                        {populationFormatter.format(country.population_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>Source: UN World Population Prospects 2024, medium variant.</span>
          <a href="https://population.un.org/wpp/" target="_blank" rel="noreferrer">
            About the data
          </a>
        </footer>
      </div>
    </main>
  );
}
