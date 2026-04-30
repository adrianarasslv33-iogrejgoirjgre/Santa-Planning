import { useState, useEffect } from "react";

const NAMES = [
  "Babiou", "Gabi", "Marraine", "Toto", "Alexandra", "Natea",
  "Carl", "Edgar", "Isa", "Isabel Ramos", "Tiago",
  "costa ferreira joaquim", "Rosa", "Diiane", "Rui",
  "Flora", "David Meniz", "Alexis", "David", "Adriana"
];

const SUNDAYS = [
  new Date(2025, 4, 10),
  new Date(2025, 4, 17),
  new Date(2025, 4, 24),
  new Date(2025, 4, 31),
  new Date(2025, 5, 7),
  new Date(2025, 5, 14),
  new Date(2025, 5, 21),
  new Date(2025, 5, 28),
];

const formatDate = (d) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

const formatDateShort = (d) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// Stable group generator: tries to keep groups similar week to week
function buildGroups(availableNames, previousGroups) {
  if (availableNames.length === 0) return [];

  // Try to reuse previous group assignments as much as possible
  const assigned = new Set();
  const groups = [];

  if (previousGroups && previousGroups.length > 0) {
    // Rebuild previous groups with available members
    for (const pg of previousGroups) {
      const kept = pg.filter((n) => availableNames.includes(n));
      if (kept.length > 0) {
        groups.push(kept);
        kept.forEach((n) => assigned.add(n));
      }
    }
  }

  // Remaining unassigned available people
  const remaining = availableNames.filter((n) => !assigned.has(n));

  // Distribute remaining into existing groups or create new ones
  for (const name of remaining) {
    // Find a group that needs members (< 5)
    const target = groups.find((g) => g.length < 5);
    if (target) {
      target.push(name);
    } else {
      groups.push([name]);
    }
  }

  // Merge groups that are too small (< 4) into adjacent groups
  const merged = [];
  let leftover = [];
  for (const g of groups) {
    if (g.length >= 4) {
      if (leftover.length > 0) {
        // Absorb leftover into this group if possible
        const canAbsorb = 5 - g.length;
        g.push(...leftover.splice(0, canAbsorb));
      }
      merged.push(g);
    } else {
      leftover.push(...g);
    }
  }

  // Handle remaining leftover
  if (leftover.length > 0) {
    // Try to distribute into existing groups
    for (const name of leftover) {
      const target = merged.find((g) => g.length < 5);
      if (target) {
        target.push(name);
      } else {
        // Create a new small group if no choice
        if (merged.length === 0 || merged[merged.length - 1].length >= 4) {
          merged.push([name]);
        } else {
          merged[merged.length - 1].push(name);
        }
      }
    }
  }

  return merged.filter((g) => g.length > 0);
}

export default function App() {
  const [view, setView] = useState("home"); // home | form | planning
  const [selectedName, setSelectedName] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  // availabilities: { name: [dateIndex, ...] }
  const [step, setStep] = useState(1);
  const [tempAvail, setTempAvail] = useState([]);
  const [saved, setSaved] = useState(false);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("availabilities");
        if (result) setAvailabilities(JSON.parse(result.value));
      } catch {}
    })();
  }, []);

  const saveAvailabilities = async (newAvail) => {
    setAvailabilities(newAvail);
    try {
      await window.storage.set("availabilities", JSON.stringify(newAvail), true);
    } catch {}
  };

  const handleNameSelect = (name) => {
    setSelectedName(name);
    // Pre-fill existing availability
    setTempAvail(availabilities[name] ? [...availabilities[name]] : []);
  };

  const toggleDate = (idx) => {
    setTempAvail((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = async () => {
    const updated = { ...availabilities, [selectedName]: tempAvail };
    await saveAvailabilities(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setView("planning");
    }, 1500);
  };

  // Compute groups per sunday
  const computePlanning = () => {
    const planning = [];
    let prevGroups = null;
    for (let i = 0; i < SUNDAYS.length; i++) {
      const available = NAMES.filter(
        (n) => availabilities[n] && availabilities[n].includes(i)
      );
      const groups = buildGroups(available, prevGroups);
      planning.push({ date: SUNDAYS[i], available, groups });
      prevGroups = groups;
    }
    return planning;
  };

  const planning = computePlanning();
  const totalResponded = Object.keys(availabilities).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c1a 0%, #1a1030 50%, #0d1f2d 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8dcc8",
      overflow: "hidden",
    }}>
      {/* Decorative background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 20% 20%, rgba(255,180,50,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(100,180,255,0.05) 0%, transparent 60%)",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>

        {/* HEADER */}
        <header style={{ textAlign: "center", padding: "48px 0 32px" }}>
          <div style={{ fontSize: 13, letterSpacing: 6, textTransform: "uppercase", color: "#f0b429", marginBottom: 12, opacity: 0.8 }}>
            Planification des dimanches
          </div>
          <h1 style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            fontWeight: 400,
            margin: 0,
            letterSpacing: 2,
            background: "linear-gradient(135deg, #fff8e7 30%, #f0b429)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}>
            Les Dimanches<br />
            <span style={{ fontSize: "0.55em", letterSpacing: 4, opacity: 0.8 }}>Mai · Juin 2025</span>
          </h1>
          <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.25)",
              borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#f0b429"
            }}>
              {totalResponded} / {NAMES.length} réponses
            </span>
            <span style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#a09080"
            }}>
              {SUNDAYS.length} dimanches • Groupes de 4-5
            </span>
          </div>
        </header>

        {/* HOME VIEW */}
        {view === "home" && (
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", padding: "16px 0 60px" }}>
            <button
              onClick={() => { setStep(1); setSelectedName(""); setView("form"); }}
              style={btnStyle("gold")}
            >
              <span style={{ fontSize: 22 }}>📅</span>
              <span>Mes disponibilités</span>
            </button>
            <button
              onClick={() => setView("planning")}
              style={btnStyle("blue")}
            >
              <span style={{ fontSize: 22 }}>👁️</span>
              <span>Voir le planning</span>
            </button>
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <div style={{ paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <button onClick={() => setView("home")} style={backBtn()}>← Retour</button>
              <div style={{ fontSize: 12, color: "#a09080", letterSpacing: 2, textTransform: "uppercase" }}>
                Disponibilités
              </div>
            </div>

            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 400, marginBottom: 8, color: "#fff8e7" }}>
                  Qui es-tu ?
                </h2>
                <p style={{ color: "#a09080", fontSize: 14, marginBottom: 28, margin: "0 0 28px" }}>
                  Sélectionne ton prénom dans la liste.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                  {NAMES.map((name) => (
                    <button
                      key={name}
                      onClick={() => { handleNameSelect(name); setStep(2); }}
                      style={{
                        padding: "14px 16px",
                        background: availabilities[name]
                          ? "rgba(240,180,41,0.15)" : "rgba(255,255,255,0.04)",
                        border: availabilities[name]
                          ? "1px solid rgba(240,180,41,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        color: availabilities[name] ? "#f0b429" : "#d0c4b0",
                        cursor: "pointer",
                        fontSize: 14,
                        textAlign: "left",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(240,180,41,0.2)"; e.currentTarget.style.borderColor = "rgba(240,180,41,0.5)"; }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = availabilities[name] ? "rgba(240,180,41,0.15)" : "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = availabilities[name] ? "rgba(240,180,41,0.4)" : "rgba(255,255,255,0.08)";
                      }}
                    >
                      {name}
                      {availabilities[name] && (
                        <span style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color: "#f0b429" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 400, marginBottom: 4, color: "#fff8e7" }}>
                  Bonjour, <span style={{ color: "#f0b429" }}>{selectedName}</span> 👋
                </h2>
                <p style={{ color: "#a09080", fontSize: 14, marginBottom: 28, margin: "0 0 28px" }}>
                  Coche les dimanches où tu es disponible.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
                  {SUNDAYS.map((d, i) => {
                    const checked = tempAvail.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleDate(i)}
                        style={{
                          padding: "16px 12px",
                          background: checked ? "rgba(240,180,41,0.18)" : "rgba(255,255,255,0.04)",
                          border: checked ? "1.5px solid #f0b429" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          color: checked ? "#fff8e7" : "#a09080",
                          cursor: "pointer",
                          fontSize: 13,
                          transition: "all 0.15s",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{checked ? "✅" : "⬜"}</span>
                        <span style={{ fontWeight: checked ? 600 : 400 }}>{formatDateShort(d)}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setTempAvail(SUNDAYS.map((_, i) => i))}
                    style={{ ...smallBtn(), background: "rgba(255,255,255,0.07)" }}
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setTempAvail([])}
                    style={{ ...smallBtn(), background: "rgba(255,255,255,0.07)" }}
                  >
                    Tout décocher
                  </button>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setStep(1)} style={smallBtn()}>← Changer de nom</button>
                  <button
                    onClick={handleSubmit}
                    style={{
                      padding: "12px 28px",
                      background: "linear-gradient(135deg, #f0b429, #e07b00)",
                      border: "none",
                      borderRadius: 10,
                      color: "#1a0a00",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: "pointer",
                      letterSpacing: 0.5,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    Valider ✓
                  </button>
                </div>

                {saved && (
                  <div style={{
                    marginTop: 20, padding: "14px 20px",
                    background: "rgba(100,220,100,0.15)", border: "1px solid rgba(100,220,100,0.3)",
                    borderRadius: 10, color: "#80e880", fontSize: 14, textAlign: "center",
                  }}>
                    ✅ Disponibilités enregistrées ! Redirection vers le planning…
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PLANNING VIEW */}
        {view === "planning" && (
          <div style={{ paddingBottom: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              <button onClick={() => setView("home")} style={backBtn()}>← Retour</button>
              <div style={{ fontSize: 12, color: "#a09080", letterSpacing: 2, textTransform: "uppercase" }}>
                Planning des groupes
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => { setStep(1); setSelectedName(""); setView("form"); }}
                style={{
                  padding: "8px 18px",
                  background: "rgba(240,180,41,0.15)",
                  border: "1px solid rgba(240,180,41,0.35)",
                  borderRadius: 8, color: "#f0b429",
                  cursor: "pointer", fontSize: 13,
                }}
              >
                📅 Modifier mes dispo
              </button>
            </div>

            {totalResponded === 0 && (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                color: "#a09080", fontSize: 15,
              }}>
                Personne n'a encore renseigné ses disponibilités.<br />
                <span style={{ color: "#f0b429", cursor: "pointer" }} onClick={() => { setStep(1); setView("form"); }}>
                  Sois le premier ! →
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {planning.map(({ date, available, groups }, wi) => (
                <div key={wi} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}>
                  {/* Date header */}
                  <div style={{
                    padding: "14px 20px",
                    background: "rgba(240,180,41,0.08)",
                    borderBottom: "1px solid rgba(240,180,41,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: "#f0b429", letterSpacing: 3, textTransform: "uppercase" }}>
                        Dimanche
                      </span>
                      <div style={{ fontSize: 18, fontWeight: 500, color: "#fff8e7" }}>
                        {formatDate(date)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        background: available.length > 0 ? "rgba(240,180,41,0.15)" : "rgba(100,100,100,0.2)",
                        border: `1px solid ${available.length > 0 ? "rgba(240,180,41,0.3)" : "rgba(100,100,100,0.3)"}`,
                        borderRadius: 12, padding: "3px 12px", fontSize: 12,
                        color: available.length > 0 ? "#f0b429" : "#707070"
                      }}>
                        {available.length} dispo{available.length > 1 ? "s" : ""}
                      </span>
                      <span style={{
                        background: "rgba(100,160,255,0.1)",
                        border: "1px solid rgba(100,160,255,0.2)",
                        borderRadius: 12, padding: "3px 12px", fontSize: 12,
                        color: "#88aaff"
                      }}>
                        {groups.length} groupe{groups.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Groups */}
                  <div style={{ padding: "16px 20px" }}>
                    {groups.length === 0 ? (
                      <div style={{ color: "#605850", fontSize: 13, fontStyle: "italic" }}>
                        Personne de disponible ce jour-là.
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {groups.map((group, gi) => (
                          <div key={gi} style={{
                            background: `rgba(${GROUP_COLORS[gi % GROUP_COLORS.length]},0.1)`,
                            border: `1px solid rgba(${GROUP_COLORS[gi % GROUP_COLORS.length]},0.25)`,
                            borderRadius: 12,
                            padding: "12px 16px",
                            minWidth: 140,
                            flex: "1 1 140px",
                            maxWidth: 220,
                          }}>
                            <div style={{
                              fontSize: 11, fontWeight: 700, letterSpacing: 2,
                              textTransform: "uppercase", marginBottom: 10,
                              color: `rgb(${GROUP_COLORS[gi % GROUP_COLORS.length]})`,
                            }}>
                              Groupe {gi + 1}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {group.map((name) => (
                                <div key={name} style={{
                                  fontSize: 13, color: "#e0d4c0",
                                  display: "flex", alignItems: "center", gap: 6,
                                }}>
                                  <span style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: `rgb(${GROUP_COLORS[gi % GROUP_COLORS.length]})`,
                                    flexShrink: 0,
                                  }} />
                                  {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Not available */}
                    {available.length < NAMES.length && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, color: "#605850", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                          Pas encore répondu ou indisponible
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {NAMES.filter(n => !available.includes(n)).map((name) => (
                            <span key={name} style={{
                              fontSize: 11, color: "#605850",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: 6, padding: "3px 8px",
                            }}>
                              {availabilities[name] ? "✗ " : "? "}{name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const GROUP_COLORS = [
  "240,180,41",   // gold
  "100,180,255",  // blue
  "150,220,150",  // green
  "255,140,180",  // pink
  "180,140,255",  // purple
];

function btnStyle(variant) {
  const isGold = variant === "gold";
  return {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "32px 40px",
    background: isGold ? "rgba(240,180,41,0.1)" : "rgba(100,160,255,0.08)",
    border: isGold ? "1.5px solid rgba(240,180,41,0.35)" : "1.5px solid rgba(100,160,255,0.25)",
    borderRadius: 16,
    color: isGold ? "#f0b429" : "#88aaff",
    cursor: "pointer",
    fontSize: 16,
    fontFamily: "Georgia, serif",
    letterSpacing: 0.5,
    minWidth: 180,
    transition: "all 0.2s",
  };
}

function smallBtn() {
  return {
    padding: "10px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#a09080",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Georgia, serif",
  };
}

function backBtn() {
  return {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#a09080",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Georgia, serif",
  };
}
