export function parseXML(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length) {
    throw new Error("Errore di parsing XML: il formato del file non è valido.");
  }

  const courseNode = xmlDoc.getElementsByTagName("*")[0];
  if (!courseNode) {
    throw new Error("Nessun nodo root trovato nel file XML.");
  }

  const courseTitle = courseNode.getAttribute("title") || "Corso senza titolo";

  const pathwayNode = Array.from(courseNode.getElementsByTagName("*"))
    .find(n => n.tagName.toLowerCase() === "pathway");

  if (!pathwayNode) {
    throw new Error("Nessun tag <pathway> trovato all'interno del corso.");
  }

  const tileNodes = Array.from(pathwayNode.getElementsByTagName("*"))
    .filter(n => n.tagName.toLowerCase() === "tile");

  const tiles = tileNodes.map((tileNode, tileIndex) => {
    const tileTitleNode = tileNode.querySelector("title");
    const tileTitle = tileTitleNode ? tileTitleNode.textContent.trim() : `Capitolo ${tileIndex + 1}`;
    
    const orbNodes = Array.from(tileNode.getElementsByTagName("*"))
      .filter(n => n.tagName.toLowerCase() === "orb");

    const orbs = orbNodes.map((orbNode, orbIndex) => {
      const orbTitleNode = orbNode.querySelector("title");
      const orbTitle = orbTitleNode ? orbTitleNode.textContent.trim() : `Lezione ${orbIndex + 1}`;
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
      return { title: orbTitle, contents };
    });
    return { title: tileTitle, orbs };
  });

  return {
    title: courseTitle,
    pathway: {
      title: pathwayNode.getAttribute("title") || "Percorso",
      tiles
    }
  };
}
