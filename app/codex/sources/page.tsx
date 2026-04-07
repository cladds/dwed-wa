import Link from "next/link";

interface Source {
  title: string;
  url: string;
  description: string;
  type: string;
}

interface SourceGroup {
  label: string;
  sources: Source[];
}

const SOURCE_GROUPS: SourceGroup[] = [
  {
    label: "Community Groups",
    sources: [
      {
        title: "Independent Raxxla Hunters (Discord)",
        url: "https://discord.gg/independentraxxlahunters",
        description: "The largest active Raxxla investigation community. Maintained verified facts channel, organised search expeditions, and debunked claims.",
        type: "discord",
      },
      {
        title: "Canonn Research",
        url: "https://canonn.science/",
        description: "Elite Dangerous science and research group. Extensive codex of lore, mysteries, and discoveries including Raxxla and Thargoid research.",
        type: "community",
      },
      {
        title: "Children of Raxxla",
        url: "https://inara.cz/squadron/85/",
        description: "In-game player faction dedicated to uncovering the truth about Raxxla. Instrumental in the Project Dynasty discoveries.",
        type: "community",
      },
      {
        title: "Vagabonds of Raxxla",
        url: "https://vagabondsofraxxla.wordpress.com/",
        description: "Research blog with codex transcripts and analysis of Raxxla-related in-game content.",
        type: "community",
      },
    ],
  },
  {
    label: "Primary Lore Sources",
    sources: [
      {
        title: "The Dark Wheel (Full Text)",
        url: "http://www.elitehomepage.org/dkwheel.htm",
        description: "Robert Holdstock's 1984 novella packaged with the original Elite. The foundational source for Raxxla lore, the Dark Wheel organisation, and the Omphalos Rift.",
        type: "novel",
      },
      {
        title: "Drew Wagar's Lore: Raxxla",
        url: "https://canonn.science/lore/drewwagar-raxxla/",
        description: "Compilation of Drew Wagar's public statements and writings about Raxxla, including his conversations with David Braben.",
        type: "lore",
      },
      {
        title: "Drew Wagar's Lore: The Dark Wheel",
        url: "https://canonn.science/lore/drewwagar-the-dark-wheel/",
        description: "Drew Wagar's collected knowledge about The Dark Wheel faction, its history, and its role in Elite lore.",
        type: "lore",
      },
      {
        title: "Elite Dangerous Codex Transcripts",
        url: "https://vagabondsofraxxla.wordpress.com/codex-transcript/",
        description: "Full transcripts of the in-game Codex entries for Raxxla and The Dark Wheel, added in Update 3.3 (December 2018).",
        type: "lore",
      },
      {
        title: "FDev/ED Relevant Quotes & Videos",
        url: "https://forums.frontier.co.uk/threads/fdev-ed-relevant-quotes-videos.553526/",
        description: "Community-maintained collection of developer quotes, interview clips, and official statements relevant to Raxxla and other mysteries.",
        type: "forum",
      },
    ],
  },
  {
    label: "Wikis & Databases",
    sources: [
      {
        title: "Raxxla - Elite Dangerous Wiki",
        url: "https://elite-dangerous.fandom.com/wiki/Raxxla",
        description: "Comprehensive wiki article on Raxxla with developer quotes, lore references, and community theories.",
        type: "wiki",
      },
      {
        title: "The Dark Wheel - Elite Dangerous Wiki",
        url: "https://elite-dangerous.fandom.com/wiki/The_Dark_Wheel",
        description: "Wiki article on The Dark Wheel faction, covering both in-game presence and lore from novels.",
        type: "wiki",
      },
      {
        title: "Permits - Elite Dangerous Wiki",
        url: "https://elite-dangerous.fandom.com/wiki/Permits",
        description: "Full list of permit-locked systems and regions, including those with unknown access methods.",
        type: "wiki",
      },
      {
        title: "Project Dynasty - Elite Dangerous Wiki",
        url: "https://elite-dangerous.fandom.com/wiki/Project_Dynasty",
        description: "The Club's secret contingency plan: three expeditions to the Formidine Rift, Hawking's Gap, and Scutum-Sagittarii Conflux.",
        type: "wiki",
      },
      {
        title: "EDSM - Elite Dangerous Star Map",
        url: "https://www.edsm.net/",
        description: "Community star map with system data, coordinates, and exploration statistics. Powers the darkwheel.space galaxy chart.",
        type: "tool",
      },
      {
        title: "EDDB / Spansh",
        url: "https://spansh.co.uk/",
        description: "Route planner and system database. Useful for searching specific system properties and planning investigation routes.",
        type: "tool",
      },
      {
        title: "Inara",
        url: "https://inara.cz/",
        description: "Commander companion tool with squadron data, BGS tracking, and engineering information.",
        type: "tool",
      },
    ],
  },
  {
    label: "Key Forum Threads",
    sources: [
      {
        title: "The Quest to Find Raxxla",
        url: "https://forums.frontier.co.uk/threads/the-quest-to-find-raxxla.168253/",
        description: "The definitive Frontier Forums thread. Over 2,000 pages and 10 years of community investigation. The primary source for darkwheel.space's forum archive.",
        type: "forum",
      },
      {
        title: "Elite and Robert Holdstock: Origins of Raxxla",
        url: "https://forums.frontier.co.uk/threads/elite-and-robert-holdstock-the-origins-of-raxxla-thruspace-and-the-dark-wheel.245233/",
        description: "Deep dive into the literary origins of Raxxla and its connections to Robert Holdstock's other works.",
        type: "forum",
      },
    ],
  },
  {
    label: "In-Game Discoveries",
    sources: [
      {
        title: "Teorge Listening Posts (RAGAZZA Logs)",
        url: "https://canonn.science/codex/teorge-listening-posts/",
        description: "Seven logs from 'Rebecca' revealing The Club's conspiracy, Project Dynasty, and the planned elimination of expedition crews.",
        type: "discovery",
      },
      {
        title: "Soontill Relics",
        url: "https://elite-dangerous.fandom.com/wiki/Soontill_Relics",
        description: "Ancient alien artefacts sold exclusively at Cheranovsky City, Ngurii. Connected to the Dark Wheel's search for Soontill.",
        type: "discovery",
      },
    ],
  },
  {
    label: "Canonical Novels",
    sources: [
      {
        title: "The Dark Wheel - Robert Holdstock (1984)",
        url: "http://www.elitehomepage.org/dkwheel.htm",
        description: "The origin of Raxxla, The Dark Wheel, and the legendary toast. Packaged with the original Elite.",
        type: "novel",
      },
      {
        title: "And Here the Wheel - John Harper (2014)",
        url: "https://elite-dangerous.fandom.com/wiki/Elite_Dangerous:_And_Here_The_Wheel",
        description: "Continues the Ryder family story. Establishes the Dark Wheel schism and the Soontill discovery.",
        type: "novel",
      },
      {
        title: "Reclamation - Drew Wagar (2014)",
        url: "https://elite-dangerous.fandom.com/wiki/Elite_Dangerous:_Reclamation",
        description: "Introduces Lady Kahina Tijani Loren (Salome) and references The Dark Wheel.",
        type: "novel",
      },
      {
        title: "Premonition - Drew Wagar (2017)",
        url: "https://elite-dangerous.fandom.com/wiki/Elite_Dangerous:_Premonition",
        description: "Covers the events leading to Salome's assassination and the exposure of The Club. Based on live in-game events.",
        type: "novel",
      },
      {
        title: "Elite: Legacy - Michael Brookes",
        url: "https://elite-dangerous.fandom.com/wiki/Elite:_Legacy",
        description: "Written by the Executive Producer of Elite Dangerous. Canonical lore by someone who knew where Raxxla was.",
        type: "novel",
      },
    ],
  },
  {
    label: "Video & Media",
    sources: [
      {
        title: "The Quest for Raxxla (YouTube Documentary)",
        url: "https://youtu.be/thwEKBU5iQ4",
        description: "Community-produced documentary covering the history of the Raxxla investigation.",
        type: "video",
      },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  discord: "text-[#5865F2]",
  community: "text-gold",
  novel: "text-status-success",
  lore: "text-gold",
  wiki: "text-coord-blue",
  forum: "text-gold",
  tool: "text-text-primary",
  discovery: "text-status-success",
  video: "text-status-danger",
};

export default function SourcesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/codex" className="font-system text-text-dim text-xs hover:text-gold transition-colors">
          &lt; Back to Codex
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-heading text-xl text-gold tracking-wide">
          Sources & References
        </h1>
        <p className="font-body text-text-mid text-sm mt-1">
          External resources, communities, and primary sources that feed the investigation. Everything on darkwheel.space traces back to these.
        </p>
      </div>

      <div className="space-y-10">
        {SOURCE_GROUPS.map((group) => (
          <div key={group.label}>
            <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4 border-b border-border pb-2">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-border bg-bg-card hover:bg-bg-hover transition-colors p-5 group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-system text-[9px] tracking-wider uppercase ${TYPE_COLORS[source.type] ?? "text-text-dim"}`}>
                      {source.type}
                    </span>
                    <h3 className="font-body text-text-primary text-base group-hover:text-gold transition-colors">
                      {source.title}
                    </h3>
                  </div>
                  <p className="font-body text-text-mid text-sm">{source.description}</p>
                  <p className="font-system text-coord-blue text-[10px] mt-2 truncate">{source.url}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
