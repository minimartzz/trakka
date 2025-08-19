import React from "react";

const Page = () => {
  const ids: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const id = Math.random().toString(36).substring(2, 15);
    ids.push(id);
  }
  // console.log(ids);

  return (
    <>
      <ul>
        {ids.map((id: string) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
      ;
    </>
  );
};

export default Page;
