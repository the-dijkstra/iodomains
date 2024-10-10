import ioDomains from "./domains";

type DomainStatus = "Available" | "Taken" | "Error";
type DomainResult = Record<string, DomainStatus>;

const tlds = [".com", ".net", ".org", ".dev", ".tech", ".co"];

const formatDomainResult = (results: DomainResult): string => {
  return Object.entries(results)
    .map(([domain, status]) => {
      const color =
        status === "Available"
          ? "\x1b[32m"
          : status === "Taken"
            ? "\x1b[31m"
            : "\x1b[33m";
      return `${color}${domain.padEnd(30)} ${status}\x1b[0m`;
    })
    .join("\n");
};

async function checkDomainDNS(domain: string): Promise<boolean> {
  try {
    const records = await Bun.dns.lookup(domain, {
      family: "IPv4",
    });
    return records.length > 0;
  } catch (error) {
    return false;
  }
}

async function checkDomainAvailability(domain: string): Promise<DomainResult> {
  const baseName = domain.replace(".io", "");
  const results: DomainResult = {};

  for (const tld of tlds) {
    const domainToCheck = `${baseName}${tld}`;

    try {
      const hasDns = await checkDomainDNS(domainToCheck);

      results[domainToCheck] = hasDns ? "Taken" : "Available";
    } catch (error) {
      console.error(
        `Error checking ${domainToCheck}:`,
        (error as Error).message,
      );
      results[domainToCheck] = "Error";
    }
  }

  return results;
}

async function checkAllDomains() {
  for (const domain of ioDomains) {
    console.log(`Checking availability for ${domain}...`);
    const availability = await checkDomainAvailability(domain);
    console.log(formatDomainResult(availability));
  }
}

checkAllDomains();