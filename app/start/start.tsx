import Image from "next/image";
import { StartButton } from "./start-button";
// import { useState } from "react";
import Link from "next/link";

// type StartPageType = null | "bedrock" | "java";

export const StartPane = () => {
  // const [page, setPage] = useState<StartPageType>(null);

  return (
    <>
      <div
        className=" flex flex-wrap flex-col md:flex-row 
    items-center justify-center gap-4"
      >
        <Link href="/start/java">
          <StartButton className="bg-green-400">
            <div className="flex items-center">
              <span className="text-center">JAVA</span>
              <Image
                src="/images/java.svg"
                alt="Java"
                className="w-12 h-12 mb-6 ml-4"
                width={48}
                height={48}
              />
            </div>
          </StartButton>
        </Link>
        <Link href="/start/bedrock">
          <StartButton className="bg-indigo-500">
            <div className="flex items-center">
              <span className="text-center">BEDROCK</span>
              <Image
                src="/images/phones.svg"
                alt="Phones"
                className="w-12 h-12 mb-4 ml-4"
                width={48}
                height={48}
              />
            </div>
          </StartButton>
        </Link>
      </div>
      <br />
      <br />
      {/* {page === "bedrock" ? <BedrockStart /> : null}
      {page === "java" ? <JavaStart /> : null} */}
    </>
  );
};
