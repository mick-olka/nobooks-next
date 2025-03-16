export default async function RegionPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const region = (await params).name;
  return <div>Поселення: {region}</div>;
}
