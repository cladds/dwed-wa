-- Seed confirmed facts from verified sources

INSERT INTO confirmed_facts (title, description, source_person, source_type, source_url, source_date, status, sort_order) VALUES

-- CONFIRMED: Developer statements
('Raxxla exists in the game',
 'David Braben confirmed that Raxxla exists in Elite Dangerous. "Does Raxxla exist? What a silly question, of course!"',
 'David Braben', 'developer', NULL, '2019', 'confirmed', 1),

('Raxxla is in the Milky Way',
 'Michael Brookes confirmed Raxxla is in the Milky Way galaxy. "It''s in the Milky Way, but I can''t tell you where at this stage. It''s a journey that everyone has to travel for themselves."',
 'Michael Brookes', 'developer', NULL, '2019', 'confirmed', 2),

('The system containing Raxxla has been visited by at least one player',
 'Michael Brookes stated that the system where Raxxla is located has been entered at least once by a commander. They jumped in, and moved on without finding it.',
 'Michael Brookes', 'developer', NULL, '2019', 'confirmed', 3),

('Writers were not allowed to explore Raxxla',
 'Drew Wagar confirmed that none of the licensed writers were allowed to explore or expand upon Raxxla in their works. It was reserved for in-house development at Frontier. Writers could reference Raxxla but not reveal anything about it.',
 'Drew Wagar', 'developer', 'http://www.drewwagar.com/progress-report/the-day-i-met-david-braben/', '2014-07-08', 'confirmed', 4),

('Salome is not related to Raxxla',
 'Drew Wagar confirmed on stream that Salome was never connected to Raxxla, because Raxxla was off limits to the writers. "We were allowed to reference it of course, but we were not allowed to expand upon Raxxla in our writings."',
 'Drew Wagar', 'developer', NULL, '2019', 'confirmed', 5),

('Secret organisations planned for certain game stages',
 'David Braben stated in a 2015 interview that there would be things that happen as you reach certain stages of the game, including getting invited to join secret organisations. "If you get invited to join a secret organisation, that can happen to lots of people."',
 'David Braben', 'developer', NULL, '2015', 'confirmed', 6),

('The Dark Wheel E/F missions were removed from the game',
 'Frontier Support confirmed that the infamous E/F missions given by The Dark Wheel in Shinrarta Dezhra were removed and are no longer present in the game.',
 'Frontier Support (Agent Viking)', 'developer', NULL, NULL, 'confirmed', 7),

('The Codex is a Pilots Federation and Universal Cartographics initiative',
 'GalNet news confirmed the Codex is a joint initiative from the Pilots Federation and Universal Cartographics, designed to catalogue stellar bodies, phenomena, and support deep-space exploration.',
 'GalNet', 'in_game', NULL, '3304-12-11', 'confirmed', 8),

-- CONFIRMED: Canonical books
('List of canonical Elite Dangerous books',
 'The canonical books are: Tales from the Frontier (Chris Booker), Lave Revolution (Allen Stroud), Reclamation (Drew Wagar), Mostly Harmless (Kate Russell), And Here the Wheel (John Harper), Out of the Darkness (T James), Elite: Legacy (Michael Brookes), Premonition (Drew Wagar), Elite Encounters RPG "Future History" section (David T.W. Hughes), Nemorensis (Simon Spurrier), Elite: Wanted (Gavin Deas), Docking is Difficult (Gideon Defoe).',
 'Drew Wagar', 'developer', NULL, NULL, 'confirmed', 9),

-- DEBUNKED claims
('HEXEDI cipher decoding RAXXLA to KWATIS',
 'Deciphering "RAXXLA" using "HEXEDI" as a key results in "KWATIS". Nothing has been found in relation to this. Assumed to be coincidence.',
 NULL, 'community', NULL, '2020-02-15', 'debunked', 20),

('CMDR Flavius Aquili coordinates claim',
 'CMDR Flavius Aquili claimed to have found Raxxla and gave coordinates. CMDR 100.RUB surveyed the area thoroughly and found nothing of interest. Marked as deliberate disinformation.',
 'CMDR Flavius Aquili', 'community', NULL, '2020', 'debunked', 21),

('CMDR Ticondrius Mobius Discord Raxxla find',
 'CMDR Ticondrius claimed to have found an anarchy system within 1,000ly of Azrael with specific characteristics and Raxxla. The proof image was confirmed fake.',
 'CMDR Ticondrius', 'community', NULL, '2020', 'debunked', 22),

('The "Dark Wheel" ouroboros logo is official',
 'The ouroboros logo commonly associated with The Dark Wheel is actually the original CoR (Children of Raxxla) player faction logo. It was player-made, based on Elite wings, the Barbury crop circle, and a dragon ouroboros from an online image source. It is NOT an official Dark Wheel logo.',
 'Harkin Ryder', 'community', NULL, '2020-05-11', 'debunked', 23),

('Ben Ryder Gateway tip-off',
 'A supposed gaming magazine tip-off about Ben Ryder and Gateway. Several researchers read every available gaming magazine from the early 1990s and could not find this post. The format does not match any known magazine format. The claim that Ben Ryder went missing but was also in Tionisla is contradictory. Confirmed false.',
 NULL, 'community', NULL, NULL, 'debunked', 24),

-- UNCONFIRMED rumours
('Raxxla is in range of a stock Cobra MkIII',
 'A persistent rumour that Raxxla is within the jump range of a stock Cobra MkIII. This has circulated for years without any citation or official source. No evidence has been found to support this claim.',
 NULL, 'community', NULL, NULL, 'rumour', 30),

('Raxxla is not France (Gallia)',
 'A theory emerged connecting Raxxla to France through the Greek word "Gallia". This has been debunked: the Greek letters translate to "Gallia" not "France", and no connection to Raxxla has been established.',
 'ScolioTheMost', 'community', NULL, '2023-07-13', 'debunked', 25);
