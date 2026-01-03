export function mapJobs(data) {
  if (!data?.items) return [];

  return data.items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    url: item.url,
  }));
}
