import { useEffect, useRef } from "react";

const ONLYOFFICE_SERVER = "http://localhost:8081";

function loadOnlyOfficeScript() {
    return new Promise((resolve, reject) => {
        if (window.DocsAPI) return resolve();
        const script = document.createElement("script");
        script.src = `${ONLYOFFICE_SERVER}/web-apps/apps/api/documents/api.js`;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Serveur OnlyOffice inaccessible."));
        document.head.appendChild(script);
    });
}

// 1. VÉRIFIE BIEN QUE onDownload EST ICI DANS LES ARGUMENTS
export default function OnlyOfficeEditor({ docUrl, title = "Modèle", onDownload }) {
    
    // 2. DÉCLARATION DU REF
    const onDownloadRef = useRef(onDownload);

    // Mise à jour du Ref quand la fonction change dans le parent
    useEffect(() => {
        console.log("OnlyOfficeEditor: Mise à jour du Ref onDownload", !!onDownload);
        onDownloadRef.current = onDownload;
    }, [onDownload]);

    useEffect(() => {
        if (!docUrl) return;

        let internalDocUrl = docUrl.replace('http://localhost/', 'http://nginx/');
        if (internalDocUrl.startsWith('/')) internalDocUrl = `http://nginx${internalDocUrl}`;

        (async () => {
            try {
                await loadOnlyOfficeScript();
                
                if (window.docEditor) {
                    window.docEditor.destroyEditor();
                }

                window.docEditor = new window.DocsAPI.DocEditor("onlyoffice-iframe", {
                    document: {
                        fileType: "docx",
                        title: title,
                        url: internalDocUrl,
                        key: btoa(docUrl).substring(0, 20) + Date.now(),
                    },
                    documentType: "word",
                    editorConfig: {
                        lang: "fr",
                        // Note: Le callbackUrl est pour OnlyOffice Server -> Laravel (backend)
                        callbackUrl: "http://nginx/api/onlyoffice/callback",
                        customization: {
                            autosave: true,
                            forcesave: true,
                        }
                    },
                    events: {
                        "onDownloadAs": function (event) {
                            console.log("Iframe: onDownloadAs reçu", event.data);
                            
                            // 3. VÉRIFICATION ET APPEL DU REF
                            if (onDownloadRef.current) {
                                console.log("Iframe: Appel de la fonction parente via Ref...");
                                onDownloadRef.current(event.data);
                            } else {
                                console.error("Iframe ERREUR: onDownloadRef.current est vide !");
                            }
                        }
                    },
                    height: "100%",
                    width: "100%",
                });
            } catch (err) {
                console.error("Erreur OnlyOffice:", err);
            }
        })();

        return () => {
            if (window.docEditor) {
                window.docEditor.destroyEditor();
                window.docEditor = null;
            }
        };
    }, [docUrl]); 

    return <div id="onlyoffice-iframe" style={{ height: "100%", width: "100%" }} />;
}