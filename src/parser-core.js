export function parseXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.querySelector("parsererror")) {
    throw new Error("Errore di parsing XML: il formato del file non è valido.");
  }

  const pathwayNode = xmlDoc.querySelector("pathway");
  if (!pathwayNode) {
    throw new Error("Nessun tag <pathway> trovato all'interno del corso.");
  }

  const courseTitle = pathwayNode.getAttribute("title") || "Corso senza titolo";
  
  const tileNodes = pathwayNode.querySelectorAll("TILE");

  const tiles = Array.from(tileNodes).map((tileNode, tileIndex) => {
    const tileTitle = tileNode.querySelector("title")?.textContent.trim() || `Capitolo ${tileIndex + 1}`;
    
    const orbNodes = tileNode.querySelectorAll("ORB");

    const orbs = Array.from(orbNodes).map((orbNode, orbIndex) => {
      const orbTitle = orbNode.querySelector("title")?.textContent.trim() || `Lezione ${orbIndex + 1}`;
      
      const contents = [];
      orbNode.querySelectorAll("lesson").forEach(lessonNode => {
        contents.push({ type: "lesson", text: lessonNode.textContent.trim() });
      });
      
      orbNode.querySelectorAll("flashcard").forEach(fcNode => {
        const q = fcNode.querySelector("question")?.textContent.trim();
        const a = fcNode.querySelector("answer")?.textContent.trim();
        if (q && a) {
          contents.push({ type: "flashcard", question: q, answer: a });
        }
      });
      
      // Ho notato che in ui.js ho usato tile.contents, quindi meglio chiamarlo così
      return { title: orbTitle, contents };
    });
    
    // Assegnamo un ID univoco e passiamo gli "orbs" (che ora chiamo "contents")
    return { id: `tile-${tileIndex}`, title: tileTitle, contents: orbs.flatMap(o => o.contents) };
  });

  return {
    title: courseTitle,
    pathway: {
      title: pathwayNode.getAttribute("title") || "Percorso",
      tiles
    }
  };
}
