import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { auth, db, userCollectionPath } from "../lib/firebase";
import { useAppStore } from "../store/useAppStore";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";
import { AppDocument, HiddenSignal, OutreachDraft, PropertySnapshot, Lead, Opportunity } from "../types";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const {
    setAuth,
    loadOnboardingData,
    setLeads,
    clearStore,
    setOpportunities,
    setDocuments,
    setPropertySnapshots,
    setHiddenSignals,
    setOutreachDrafts,
  } = useAppStore();

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeLeads = () => {};
    let unsubscribeOpps = () => {};
    let unsubscribeDocs = () => {};
    let unsubscribeSnapshots = () => {};
    let unsubscribeSignals = () => {};
    let unsubscribeDrafts = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeUser();
      unsubscribeLeads();
      unsubscribeOpps();
      unsubscribeDocs();
      unsubscribeSnapshots();
      unsubscribeSignals();
      unsubscribeDrafts();

      if (user) {
        setAuth(true, user.uid);

        try {
          const userDocPath = `users/${user.uid}`;
          unsubscribeUser = onSnapshot(
            doc(db, "users", user.uid),
            (userDoc) => {
              if (userDoc.exists()) {
                const data = userDoc.data();
                loadOnboardingData({
                  businessName: data.businessName || "",
                  focus: data.focus || "",
                  followUpStyle: data.followUpStyle || "casual",
                  cadence: data.cadence || "2",
                  isPro: data.isPro || false,
                  apiKeys: data.apiKeys || {},
                  activeAiProvider: data.activeAiProvider || "gemini",
                  selectedModels: data.selectedModels || {},
                  gettingStartedDismissed: data.gettingStartedDismissed || false,
                }, true);
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.GET, userDocPath);
            }
          );

          const leadsPath = userCollectionPath(user.uid, "leads");
          unsubscribeLeads = onSnapshot(
            collection(db, leadsPath),
            (snapshot) => {
              const leadsRecord: Lead[] = [];
              snapshot.forEach((doc) => {
                leadsRecord.push({ id: doc.id, ...doc.data() } as Lead);
              });
              setLeads(leadsRecord);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, leadsPath);
            }
          );

          const oppsPath = userCollectionPath(user.uid, "opportunities");
          unsubscribeOpps = onSnapshot(
            collection(db, oppsPath),
            (snapshot) => {
              const oppsRecord: Opportunity[] = [];
              snapshot.forEach((doc) => {
                oppsRecord.push({ id: doc.id, ...doc.data() } as Opportunity);
              });
              setOpportunities(oppsRecord);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, oppsPath);
            }
          );

          const docsPath = userCollectionPath(user.uid, "documents");
          unsubscribeDocs = onSnapshot(
            collection(db, docsPath),
            (snapshot) => {
              const docsRecord: AppDocument[] = [];
              snapshot.forEach((doc) => {
                docsRecord.push({ id: doc.id, ...doc.data() } as AppDocument);
              });
              setDocuments(docsRecord);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, docsPath);
            }
          );

          const snapshotsPath = userCollectionPath(user.uid, "propertySnapshots");
          unsubscribeSnapshots = onSnapshot(
            collection(db, snapshotsPath),
            (snapshot) => {
              const records: PropertySnapshot[] = [];
              snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as PropertySnapshot);
              });
              setPropertySnapshots(records);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, snapshotsPath);
            }
          );

          const signalsPath = userCollectionPath(user.uid, "hiddenSignals");
          unsubscribeSignals = onSnapshot(
            collection(db, signalsPath),
            (snapshot) => {
              const records: HiddenSignal[] = [];
              snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as HiddenSignal);
              });
              setHiddenSignals(records);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, signalsPath);
            }
          );

          const draftsPath = userCollectionPath(user.uid, "outreachDrafts");
          unsubscribeDrafts = onSnapshot(
            collection(db, draftsPath),
            (snapshot) => {
              const records: OutreachDraft[] = [];
              snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as OutreachDraft);
              });
              setOutreachDrafts(records);
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, draftsPath);
            }
          );

          setLoading(false);
        } catch (e) {
          console.error("Setup error", e);
          setLoading(false);
        }
      } else {
        setAuth(false, null);
        clearStore();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeLeads();
      unsubscribeOpps();
      unsubscribeDocs();
      unsubscribeSnapshots();
      unsubscribeSignals();
      unsubscribeDrafts();
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return <>{children}</>;
}
