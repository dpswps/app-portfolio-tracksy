export type MyRunCard = {
  id: string;
  image: string;
  portraitImage: string;
  date: string;
  title: string;
  dist: string;
  distColor: string;
  pace: string;
  time: string;
  kcal: string;
  elev: string;
  cadence: string;
  bpm: string;
};

export const myCards: MyRunCard[] = [
  {
    id: "mc1",
    image: "/card1.png",
    portraitImage: "/runner1.jpg",
    date: "2024. 05. 12 (월)",
    title: "한강 러닝 10K",
    dist: "5.23",
    distColor: "#FFFFFF",
    pace: "6'35\"",
    time: "34:20",
    kcal: "278",
    elev: "18 m",
    cadence: "142",
    bpm: "165",
  },
  {
    id: "mc2",
    image: "/card2.png",
    portraitImage: "/runner2.jpg",
    date: "2024. 04. 28 (월)",
    title: "석양 러닝",
    dist: "7.21",
    distColor: "#F59E0B",
    pace: "6'18\"",
    time: "45:22",
    kcal: "356",
    elev: "32 m",
    cadence: "150",
    bpm: "172",
  },
  {
    id: "mc3",
    image: "/card3.png",
    portraitImage: "/runner3.jpg",
    date: "2024. 06. 08 (토)",
    title: "트레일 러닝",
    dist: "10.35",
    distColor: "#A3E635",
    pace: "6'45\"",
    time: "1:10:12",
    kcal: "578",
    elev: "486 m",
    cadence: "136",
    bpm: "182",
  },
];
