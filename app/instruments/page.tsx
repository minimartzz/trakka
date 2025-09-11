import { generateSessionId, getWinContrib, getScore } from "@/utils/sessionLog";
import React from "react";

const Page = async () => {
  // const results = await getHighScore("157969", "a16cb5c8-8272-4fef-bf8d-5c0a532ce22d");

  const sessionId = generateSessionId();
  const winContribWinner = getWinContrib(5, true);
  const winContribLoser = getWinContrib(5, false);
  const first = getScore(1, 5, 60, 1.6611);
  const second = getScore(2, 5, 60, 1.6611);
  const third = getScore(3, 5, 60, 1.6611);
  const fourth = getScore(4, 5, 60, 1.6611);
  const fifth = getScore(5, 5, 60, 1.6611);

  return (
    <>
      <p>SessionId: {sessionId}</p>
      <p>winner contrib: {winContribWinner}</p>
      <p>loser contrib: {winContribLoser}</p>
      <br />
      <p>first: {first}</p>
      <p>second: {second}</p>
      <p>third: {third}</p>
      <p>fourth: {fourth}</p>
      <p>fifth: {fifth}</p>
      <br />
    </>
  );
};

export default Page;
