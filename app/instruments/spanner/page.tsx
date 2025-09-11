"use client";
const Page = () => {
  // useEffect(() => {
  //   async function fetchPosts() {
  //     try {
  //       const response = await fetch("/api/group");
  //       console.log(response);
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok");
  //       }
  //       const data: Groups[] = await response.json();
  //       setGroups(data);
  //     } catch (err) {
  //       console.log("Whoops");
  //       console.error(err);
  //     }
  //   }

  //   fetchPosts();
  // }, []); // Empty dependency array means this runs once on mount

  // const test = async (gameId: string, profileId: number) => {
  //   const result = await getFirstPlay(gameId, profileId);
  //   console.log(result);
  // };

  // useEffect(() => {
  //   test("157969", 8);
  // }, []);

  return (
    <div className="pt-20">
      {/* <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <p>{group.group_id}</p>
          </li>
        ))}
      </ul> */}
      <h1>Testing</h1>
    </div>
  );
};

export default Page;
