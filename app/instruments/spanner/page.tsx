"use client";
import React, { useEffect, useState } from "react";

interface Groups {
  id: string;
  group_id: string;
}

const page = () => {
  const [groups, setGroups] = useState<Groups[]>([]);
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch("/api/group");
        console.log(response);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: Groups[] = await response.json();
        setGroups(data);
      } catch (err) {
        console.log("Whoops");
        console.error(err);
      }
    }

    fetchPosts();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="pt-20">
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <p>{group.group_id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default page;
