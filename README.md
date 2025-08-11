# Prisma

Benvenuto in Prisma, una web app di apprendimento progettata per trasformare argomenti complessi in percorsi di conoscenza chiari e strutturati. Come un prisma scompone la luce, Prisma scompone il sapere in moduli digeribili, guidando l'utente attraverso un percorso di apprendimento sequenziale e interattivo.

Il progetto è costruito con JavaScript moderno (moduli ES6), HTML5 e CSS3, senza dipendenze da framework esterni, per garantire leggerezza e massima manutenibilità.

## ✨ Caratteristiche Principali

-   **Struttura a Corsi Dinamici**: I corsi sono definiti in un indice centralizzato (`courses.json`), permettendo di espandere la libreria di contenuti senza modificare il codice sorgente.
-   **Progressione Guidata**: I moduli di apprendimento (`orb`) si sbloccano in modo strettamente sequenziale, assicurando che l'utente padroneggi un concetto prima di passare al successivo.
-   **Sistema di Studio Efficace**:
    -   Supporto integrato per lezioni teoriche e flashcard interattive.
    -   **Ciclo di Maestria**: Le flashcard a cui si risponde in modo errato vengono riproposte alla fine del modulo, rinforzando l'apprendimento finché la risposta non è corretta.
-   **Tracciamento dei Progressi**: I progressi di ogni corso vengono salvati localmente nel browser (`localStorage`), permettendo all'utente di riprendere da dove aveva lasciato. Una barra di completamento visiva mostra l'avanzamento generale.
-   **Architettura Modulare**: Il codice JavaScript è suddiviso in moduli specializzati seguendo il Single Responsibility Principle, rendendo il codice pulito, scalabile e facile da manutenere.

## 🚀 Guida Rapida

L'applicazione non richiede alcuna procedura di build o installazione di dipendenze.

1.  **Clona o scarica il progetto:**
    ```bash
    git clone [https://github.com/tuo-username/prisma.git](https://github.com/tuo-username/prisma.git)
    cd prisma
    ```
2.  **Avvia un server locale:**
    Poiché l'applicazione utilizza l'API `fetch` per caricare dinamicamente i file dei corsi, non può essere eseguita direttamente da `file:///`. È necessario un server locale per servire i file.
    
    Il modo più semplice è usare l'estensione **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** per Visual Studio Code. Una volta installata, fai clic con il tasto destro sul file `index.html` e seleziona "Open with Live Server".

3.  **Inizia il tuo percorso!**
    Il browser si aprirà automaticamente all'indirizzo corretto (es. `http://127.0.0.1:5500`), pronto per iniziare.

## 📂 Struttura del Progetto

L'architettura del codice è pensata per essere chiara e scalabile.

prisma/
├── courses/
│   └── tuo_corso.xml            # I file XML dei corsi
├── src/
│   ├── ui/                      # Moduli dedicati all'interfaccia utente
│   │   ├── ui-common.js         # Funzioni e costanti condivise dalla UI
│   │   ├── ui-learning.js       # Gestisce la vista della sessione di studio
│   │   ├── ui-loader.js         # Gestisce la schermata di selezione dei corsi
│   │   └── ui-pathway.js        # Gestisce la vista del percorso di apprendimento
│   ├── main.js                  # "Cervello" dell'app, orchestra gli eventi
│   ├── eventBus.js              # Sistema di comunicazione tra moduli
│   ├── parser.js                # Wrapper per il parsing dell'XML
│   ├── parser-core.js           # Logica di parsing pura
│   ├── progress.js              # Gestisce la logica dei progressi
│   └── progress-core.js         # Interagisce con il localStorage per i progressi
├── courses.json                 # Indice di tutti i corsi disponibili
├── index.html                   # Entry point e struttura della pagina
├── style.css                    # Stili dell'applicazione
└── README.md                    # Questo file


## ✍️ Creare i Tuoi Corsi

Aggiungere nuovi contenuti è semplicissimo:

1.  **Crea il file del corso**: Scrivi il contenuto del tuo corso in un nuovo file `.xml` e salvalo nella cartella `/courses`.
2.  **Aggiorna l'indice**: Aggiungi una nuova voce al file `courses.json` per descrivere il tuo corso e puntare al file XML corrispondente.
3.  **Struttura il tuo XML**: Segui questo schema per garantire la compatibilità con il parser.

    ```xml
    <course>
        <pathway title="Titolo del Tuo Corso">
            <TILE>
                <title>Titolo del Capitolo 1</title>
                <ORB>
                    <title>Titolo del Modulo 1.1</title>
                    <LESSON>
                        Testo della tua lezione qui.
                    </LESSON>
                    <FLASHCARD>
                        <question>La tua domanda qui.</question>
                        <answer>La risposta corretta qui.</answer>
                    </FLASHCARD>
                </ORB>
            </TILE>
            </pathway>
    </course>
    ```
