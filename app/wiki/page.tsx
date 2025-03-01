import { PageTransitionWrapper } from "@/app/components";
import Image from "next/image";
import Link from "next/link";

export default function WikiPage() {
  return (
    <PageTransitionWrapper className="p-8">
      <h1 className="text-3xl font-bold text-center m-4">no boobs Wiki</h1>
      <div className="flex flex-wrap gap-12 justify-center">
        <Link
          href="/wiki/regions"
          className="p-8 rounded-lg shadow-md bg-base-100 hover:shadow-lg hover:translate-y-[-10px] transition-all duration-300 max-w-96"
        >
          <h2 className="text-2xl font-semibold mb-2">Поселення</h2>
          <Image
            src="/images/region.png"
            alt="Regions"
            width={400}
            height={400}
            className="rounded-lg m-auto lg:h-80 w-80"
          />
          <p className="text-gray-600">
            Познайомтеся з різними поселеннями, їх правилами та особливостями
          </p>
        </Link>

        <Link
          href="/wiki/history"
          className="p-8 rounded-lg shadow-md bg-base-100 hover:shadow-lg hover:translate-y-[-10px] transition-all duration-300 max-w-96"
        >
          <h2 className="text-2xl font-semibold mb-2">Історія сервера</h2>
          <Image
            src="/images/history.png"
            alt="Regions"
            width={400}
            height={400}
            className="rounded-lg m-auto lg:h-80 w-80"
          />
          <p className="text-gray-600">
            Познайомтеся з історією сервера та його розвитком
          </p>
        </Link>
      </div>
    </PageTransitionWrapper>
  );
}
