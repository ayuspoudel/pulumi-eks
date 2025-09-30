export function buildTags(name: string) {
  return {
    Name: name,
    Creation_Date: new Date().toISOString(),
    Description: "Created by TMS Automation",
    Managed_By: "TMS",
    Created_By: "TMS-Automation",
  };
}