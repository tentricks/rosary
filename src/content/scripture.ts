export const scriptureRefs = {
  joyful: [
    [
      {
        label: "Luke 1:26–38",
        target: "Luke 1.26-38",
      },
    ],
    [
      {
        label: "Luke 1:39–45",
        target: "Luke 1.39-45",
      },
    ],
    [
      {
        label: "Luke 2:1–21",
        target: "Luke 2.1-21",
      },
    ],
    [
      {
        label: "Luke 2:22–38",
        target: "Luke 2.22-38",
      },
    ],
    [
      {
        label: "Luke 2:41–52",
        target: "Luke 2.41-52",
      },
    ],
  ],
  luminous: [
    [
      {
        label: "Luke 3:21–22",
        target: "Luke 3.21-22",
      },
    ],
    [
      {
        label: "John 2:1–11",
        target: "John 2.1-11",
      },
    ],
    [
      {
        label: "Matthew 5–7",
        target: "Matthew 5-7",
      },
    ],
    [
      {
        label: "Luke 9:28–36",
        target: "Luke 9.28-36",
      },
    ],
    [
      {
        label: "Luke 22:14–23",
        target: "Luke 22.14-23",
      },
    ],
  ],
  sorrowful: [
    [
      {
        label: "Luke 22:39–46",
        target: "Luke 22.39-46",
      },
    ],
    [
      {
        label: "John 19:1",
        target: "John 19.1",
      },
    ],
    [
      {
        label: "John 19:2",
        target: "John 19.2",
      },
    ],
    [
      {
        label: "John 19:17",
        target: "John 19.17",
      },
    ],
    [
      {
        label: "John 19:17–37",
        target: "John 19.17-37",
      },
    ],
  ],
  glorious: [
    [
      {
        label: "John 20:1–10",
        target: "John 20.1-10",
      },
      {
        label: "Matthew 28:1–8",
        target: "Matthew 28.1-8",
      },
    ],
    [
      {
        label: "Acts 1:8–11",
        target: "Acts 1.8-11",
      },
    ],
    [
      {
        label: "Acts 2:1–6",
        target: "Acts 2.1-6",
      },
    ],
    [
      {
        label: "Catechism of the Catholic Church §966",
        url: "https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_two/article_3.html",
      },
      {
        label: "Revelation 12:1–3",
        target: "Revelation 12.1-3",
      },
    ],
    [
      {
        label: "1 Kings 2:19",
        target: "1 Kings 2.19",
      },
      {
        label: "Revelation 12:1–5",
        target: "Revelation 12.1-5",
      },
    ],
  ],
};
export interface ScriptureReference {
  label: string;
  target?: string;
  url?: string;
}
export function scriptureUrl(ref: ScriptureReference): string {
  return (
    ref.url ||
    "https://biblia.com/books/RSV2CE/" + encodeURIComponent(ref.target!)
  );
}
