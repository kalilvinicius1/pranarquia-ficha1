import React, { useEffect, useMemo, useState } from "react";
import {
  auth,
  collection,
  collectionGroup,
  createUserWithEmailAndPassword,
  db,
  deleteDoc,
  doc,
  EmailAuthProvider,
  getDoc,
  getDocs,
  isFirebaseConfigured,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "./firebase.js";

const ATTRIBUTE_MAX = 7;
const SKILL_MAX = 7;
const BALANCE_MAX = 7;
const PRANA_NEGATIVE_MAX = 7;
const PRANA_POSITIVE_MAX = 15;
const PRANA_TOTAL = PRANA_NEGATIVE_MAX + PRANA_POSITIVE_MAX;
const VITALITY_BASE = 5;
const MILESTONE_MAX = 7;
const STORAGE_KEY = "pranarquia-character-sheet-react";

const runeGroups = {
  caalesi: {
    label: "Caalesi",
    runes: [
      { key: "", label: "A definir", file: "" },
      { key: "fogo", label: "Fogo", file: "assets/runas/fogo.png" },
      { key: "ar", label: "Ar", file: "assets/runas/ar.png" },
      { key: "agua", label: "Água", file: "assets/runas/agua.png" },
      { key: "terra", label: "Terra", file: "assets/runas/terra.png" },
      { key: "terra-agua", label: "Terra + Água", file: "assets/runas/terra-agua.png" },
      { key: "terra-fogo", label: "Terra + Fogo", file: "assets/runas/terra-fogo.png" },
      { key: "terra-ar", label: "Terra + Ar", file: "assets/runas/terra-ar.png" },
      { key: "agua-fogo", label: "Água + Fogo", file: "assets/runas/agua-fogo.png" },
      { key: "agua-ar", label: "Água + Ar", file: "assets/runas/agua-ar.png" },
      { key: "ar-fogo", label: "Ar + Fogo", file: "assets/runas/ar-fogo.png" },
    ],
  },
  daemoi: {
    label: "Daemoi",
    runes: [
      { key: "arista", label: "Arista", file: "assets/runas/arista.png" },
      { key: "xuthur", label: "Xuth’ur", file: "assets/runas/xuthur.png" },
      { key: "gannith", label: "Gannith", file: "assets/runas/gannith.png" },
      { key: "izramath", label: "Izramath", file: "assets/runas/izramath.png" },
      { key: "agralan", label: "Agralan", file: "assets/runas/agralan.png" },
      { key: "dragthath", label: "Drag’thath", file: "assets/runas/dragthath.png" },
      { key: "xurgrathog", label: "Xurgrathog’Drolluuth", file: "assets/runas/xurgrathog-drolluuth.png" },
    ],
  },
  tenebri: {
    label: "Tenebri",
    runes: [
      { key: "sacerdote-da-noite", label: "Sacerdote da Noite", file: "assets/runas/sacerdote-da-noite.png" },
      { key: "purificador", label: "Purificador", file: "assets/runas/purificador.png" },
      { key: "colecionador", label: "Colecionador", file: "assets/runas/colecionador.png" },
      { key: "coveiro-de-si-mesmo", label: "Coveiro de Si Mesmo", file: "assets/runas/coveiro-de-si-mesmo.png" },
      { key: "profanador", label: "Profanador", file: "assets/runas/profanador.png" },
    ],
  },
};

const domains = [
  {
    key: "body",
    title: "Corpo",
    vitalityTitle: "Vitalidade de Corpo",
    vitalityAttribute: "vigor",
    attributes: [
      { key: "force", label: "Força" },
      { key: "reflexes", label: "Reflexos" },
      { key: "vigor", label: "Vigor" },
    ],
    skills: [
      { key: "acrobatics", label: "Acrobacia" },
      { key: "weapons", label: "Armas" },
      { key: "athletics", label: "Atletismo" },
      { key: "brawl", label: "Briga" },
      { key: "stealth", label: "Furtividade" },
      { key: "piloting", label: "Pilotagem" },
      { key: "sleight", label: "Prestidigitação" },
      { key: "resistance", label: "Resistência" },
    ],
  },
  {
    key: "mind",
    title: "Mente",
    vitalityTitle: "Vitalidade de Mente",
    vitalityAttribute: "ego",
    attributes: [
      { key: "ego", label: "Ego" },
      { key: "intellect", label: "Intelecto" },
      { key: "intuition", label: "Intuição" },
    ],
    skills: [
      { key: "cunning", label: "Astúcia" },
      { key: "erudition", label: "Erudição" },
      { key: "investigation", label: "Investigação" },
      { key: "perception", label: "Percepção" },
      { key: "intimidation", label: "Intimidação" },
      { key: "expression", label: "Expressão" },
      { key: "medicine", label: "Medicina" },
      { key: "subterfuge", label: "Subterfúgio" },
    ],
  },
  {
    key: "spirit",
    title: "Espírito",
    vitalityTitle: "Vitalidade de Espírito",
    vitalityAttribute: "will",
    attributes: [
      { key: "charisma", label: "Carisma" },
      { key: "faith", label: "Fé" },
      { key: "will", label: "Vontade" },
    ],
    skills: [
      { key: "command", label: "Comando" },
      { key: "empathy", label: "Empatia" },
      { key: "pranology", label: "Pranalogia" },
      { key: "persuasion", label: "Persuasão" },
      { key: "manipulation", label: "Manipulação" },
      { key: "meditation", label: "Meditação" },
      { key: "occultism", label: "Ocultismo" },
      { key: "potency", label: "Potência" },
    ],
  },
];

const manifestationTypes = [
  { key: "instinctive", title: "Manifestações Instintivas", cost: "C: 1PR" },
  { key: "conscious", title: "Manifestações Conscientes", cost: "C: 2PR" },
  { key: "ritualistic", title: "Manifestações Ritualísticas", cost: "C: 3PR" },
  { key: "channeled", title: "Manifestações Canalizadas", cost: "C: 4PR" },
  { key: "majestic", title: "Manifestações Majestosas", cost: "C: 5PR" },
  { key: "divine", title: "Manifestações Divinas", cost: "C: 6PR" },
  { key: "archetypal", title: "Manifestações Arquetípicas", cost: "C: 7PR" },
];

const emptySheet = {
  version: 2,
  fields: {
    characterName: "",
    lineage: "",
    bond: "",
    archetype: "",
    reverieTitle: "",
    reverieDescription: "",
    conflict: "",
    conflictDescription: "",
    inventory: "",
    xpTotal: 0,
    xpSpent: 0,
    typeDaemoi: false,
    typeCaalesi: false,
    typeTenebri: false,
  },
  state: {
    attributes: {
      force: 0,
      reflexes: 0,
      vigor: 0,
      ego: 0,
      intellect: 0,
      intuition: 0,
      charisma: 0,
      faith: 0,
      will: 0,
    },
    skills: {
      acrobatics: 0,
      weapons: 0,
      athletics: 0,
      brawl: 0,
      stealth: 0,
      piloting: 0,
      sleight: 0,
      resistance: 0,
      cunning: 0,
      erudition: 0,
      investigation: 0,
      perception: 0,
      intimidation: 0,
      expression: 0,
      medicine: 0,
      subterfuge: 0,
      command: 0,
      empathy: 0,
      pranology: 0,
      persuasion: 0,
      manipulation: 0,
      meditation: 0,
      occultism: 0,
      potency: 0,
    },
    specializations: {},
    openSpecialization: null,
    vitalityMarks: { body: {}, mind: {}, spirit: {} },
    balance: {
      decline: 0,
      ascension: 0,
    },
    prana: { available: PRANA_TOTAL },
    milestones: 0,
    runeGroup: "caalesi",
    rune: "",
    traits: {
      required: [{ name: "", description: "" }],
      bought: [{ name: "", description: "" }],
    },
    manifestations: {},
  },
};

const defaultSheet = clone(emptySheet);

function clone(value) {
  return structuredClone(value);
}

function loadInitialSheet() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return clone(defaultSheet);
  }

  try {
    return normalizeSheet(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return clone(defaultSheet);
  }
}

function normalizeSheet(data) {
  const sheet = clone(defaultSheet);
  deepMerge(sheet, data || {});

  if (typeof sheet.state.balance === "number") {
    sheet.state.balance = {
      decline: sheet.state.balance < 0 ? Math.abs(sheet.state.balance) : 0,
      ascension: sheet.state.balance > 0 ? sheet.state.balance : 0,
    };
  }

  sheet.state.balance.decline = clamp(Number(sheet.state.balance.decline) || 0, 0, BALANCE_MAX);
  sheet.state.balance.ascension = clamp(Number(sheet.state.balance.ascension) || 0, 0, BALANCE_MAX);
  sheet.state.prana.available = clamp(Number(sheet.state.prana.available) || 0, 0, PRANA_TOTAL);
  sheet.state.milestones = clamp(Number(sheet.state.milestones) || 0, 0, MILESTONE_MAX);

  return sheet;
}

function deepMerge(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], value);
      return;
    }
    target[key] = value;
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function safeFileName(name) {
  const baseName = (name || "ficha-pranarquia")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ");
  return `${baseName || "ficha-pranarquia"}.json`;
}

function BrandHeader() {
  return (
    <header className="brand-header">
      <p>"Ascender ou ruir. Mas nunca repousar."</p>
      <h1>Pranarquia</h1>
    </header>
  );
}

function SectionRuler({ children }) {
  return (
    <div className="section-ruler">
      <span />
      <h2>{children}</h2>
      <span />
    </div>
  );
}

function DotTrack({ max, value, onSelect, label }) {
  return (
    <div className="dot-track" role="group" aria-label={label}>
      {Array.from({ length: max }, (_, index) => index + 1).map((item) => (
        <button
          key={item}
          className={`dot ${item <= value ? "is-filled" : ""}`}
          type="button"
          aria-label={`${label} ${item}`}
          aria-pressed={item <= value}
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  );
}

function BalanceTrack({ value, updateDraft }) {
  const decline = value.decline || 0;
  const ascension = value.ascension || 0;

  const pull = (side) => {
    updateDraft((draft) => {
      if (side === "ascension") {
        if (draft.state.balance.decline > 0) {
          draft.state.balance.decline -= 1;
        }
        draft.state.balance.ascension = clamp(draft.state.balance.ascension + 1, 0, BALANCE_MAX);
      } else {
        if (draft.state.balance.ascension > 0) {
          draft.state.balance.ascension -= 1;
        }
        draft.state.balance.decline = clamp(draft.state.balance.decline + 1, 0, BALANCE_MAX);
      }
    });
  };

  const remove = (side) => {
    updateDraft((draft) => {
      if (side === "decline" && draft.state.balance.decline > 0) {
        draft.state.balance.decline -= 1;
      }
      if (side === "ascension" && draft.state.balance.ascension > 0) {
        draft.state.balance.ascension -= 1;
      }
    });
  };

  return (
    <div className="split-track">
      <button className="track-label balance-control" type="button" onClick={() => pull("decline")}>
        Declínio &lt;
      </button>
      <ReadOnlyDots max={BALANCE_MAX} value={decline} reverse onFilledClick={() => remove("decline")} label="Declínio" />
      <span className="track-divider">|</span>
      <ReadOnlyDots max={BALANCE_MAX} value={ascension} onFilledClick={() => remove("ascension")} label="Ascensão" />
      <button className="track-label balance-control" type="button" onClick={() => pull("ascension")}>
        &gt; Ascensão
      </button>
    </div>
  );
}

function ReadOnlyDots({ max, value, label, reverse = false, onFilledClick }) {
  const sequence = Array.from({ length: max }, (_, index) => index + 1);
  if (reverse) {
    sequence.reverse();
  }

  return (
    <div className="dot-track" role="group" aria-label={label}>
      {sequence.map((item) => {
        const filled = item <= value;
        return (
          <button
            key={item}
            className={`dot read-only-dot ${filled ? "is-filled removable-dot" : ""}`}
            type="button"
            aria-label={`${label} ${item}`}
            aria-pressed={filled}
            onClick={filled ? onFilledClick : undefined}
          />
        );
      })}
    </div>
  );
}

function PranaTrack({ available, updateDraft }) {
  const setPrana = (position) => {
    updateDraft((draft) => {
      draft.state.prana.available = position <= draft.state.prana.available ? position - 1 : position;
    });
  };

  return (
    <div className="split-track prana-track">
      <div className="prana-group">
        <PranaDots start={1} end={PRANA_NEGATIVE_MAX} available={available} onSelect={setPrana} />
        <span className="track-label">NEGATIVA</span>
      </div>
      <span className="track-divider">|</span>
      <PranaDots start={PRANA_NEGATIVE_MAX + 1} end={PRANA_TOTAL} available={available} onSelect={setPrana} />
    </div>
  );
}

function PranaDots({ start, end, available, onSelect }) {
  return (
    <div className="dot-track prana-dot-track" role="group" aria-label="Prana">
      {Array.from({ length: end - start + 1 }, (_, index) => start + index).map((position) => (
        <button
          key={position}
          className={`dot ${position <= available ? "is-filled" : ""}`}
          type="button"
          aria-label={`Prana ${position}`}
          aria-pressed={position <= available}
          onClick={() => onSelect(position)}
        />
      ))}
    </div>
  );
}

function RuneBox({ sheet, updateDraft }) {
  const selected = runeGroups[sheet.state.runeGroup].runes.find((rune) => rune.key === sheet.state.rune);

  return (
    <div className="rune-box" aria-label="Runa">
      <span>Runa</span>
      <span
        className={`rune-mark ${selected?.file ? "has-image" : ""}`}
        style={selected?.file ? { backgroundImage: `url("${selected.file}")` } : undefined}
        aria-hidden="true"
      />
      <select
        aria-label="Tipo de runa"
        value={sheet.state.runeGroup}
        onChange={(event) => {
          const group = event.target.value;
          updateDraft((draft) => {
            draft.state.runeGroup = group;
            draft.state.rune = runeGroups[group].runes[0].key;
          });
        }}
      >
        {Object.entries(runeGroups).map(([key, group]) => (
          <option key={key} value={key}>
            {group.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Selecionar runa"
        value={sheet.state.rune}
        onChange={(event) => {
          updateDraft((draft) => {
            draft.state.rune = event.target.value;
          });
        }}
      >
        {runeGroups[sheet.state.runeGroup].runes.map((rune) => (
          <option key={rune.key || "empty"} value={rune.key}>
            {rune.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function IdentityBlock({ fields, setField }) {
  return (
    <div className="identity-block">
      <label>
        <span>Nome</span>
        <input value={fields.characterName} onChange={(event) => setField("characterName", event.target.value)} />
      </label>
      <label>
        <span>Linhagem</span>
        <input value={fields.lineage} placeholder="A definir" onChange={(event) => setField("lineage", event.target.value)} />
      </label>
      <label>
        <span>Vínculo</span>
        <input value={fields.bond} placeholder="A definir" onChange={(event) => setField("bond", event.target.value)} />
      </label>
      <label>
        <span>Arquétipo</span>
        <input value={fields.archetype} placeholder="A definir" onChange={(event) => setField("archetype", event.target.value)} />
      </label>
      <label>
        <span>Devaneio</span>
        <input value={fields.reverieTitle} placeholder="Título do devaneio" onChange={(event) => setField("reverieTitle", event.target.value)} />
      </label>
      <label className="wide-field">
        <span>Descrição</span>
        <textarea
          value={fields.reverieDescription}
          placeholder="Explique o devaneio do personagem"
          onChange={(event) => setField("reverieDescription", event.target.value)}
        />
      </label>
    </div>
  );
}

function DomainColumn({ domain, sheet, updateDraft }) {
  const vitalityTotal = VITALITY_BASE + sheet.state.attributes[domain.vitalityAttribute];

  const setAttribute = (key, value) => {
    updateDraft((draft) => {
      draft.state.attributes[key] = draft.state.attributes[key] === value ? 0 : value;
      const total = VITALITY_BASE + draft.state.attributes[domain.vitalityAttribute];
      Object.keys(draft.state.vitalityMarks[domain.key]).forEach((mark) => {
        if (Number(mark) > total) {
          delete draft.state.vitalityMarks[domain.key][mark];
        }
      });
    });
  };

  const setSkill = (key, value) => {
    updateDraft((draft) => {
      draft.state.skills[key] = draft.state.skills[key] === value ? 0 : value;
    });
  };

  return (
    <section className="domain">
      <h2>{domain.title}</h2>
      {domain.attributes.map((attribute) => (
        <div className="attribute-row" key={attribute.key}>
          <button className="row-label" type="button">
            {attribute.label}
          </button>
          <DotTrack max={ATTRIBUTE_MAX} value={sheet.state.attributes[attribute.key]} label={attribute.label} onSelect={(value) => setAttribute(attribute.key, value)} />
        </div>
      ))}
      <VitalityTrack domain={domain} total={vitalityTotal} marks={sheet.state.vitalityMarks[domain.key]} updateDraft={updateDraft} />
      {domain.skills.map((skill) => (
        <SkillRow key={skill.key} skill={skill} sheet={sheet} setSkill={setSkill} updateDraft={updateDraft} />
      ))}
    </section>
  );
}

function VitalityTrack({ domain, total, marks, updateDraft }) {
  return (
    <div className="vitality-row">
      <div className="vitality-title">{domain.vitalityTitle}</div>
      <div className="box-track">
        {Array.from({ length: total }, (_, index) => index + 1).map((item) => {
          const mark = marks[item] || 0;
          return (
            <button
              key={item}
              className={`vitality-box ${mark === 1 ? "is-light" : ""} ${mark === 2 ? "is-heavy" : ""}`}
              type="button"
              aria-label={`${domain.vitalityTitle} ${item}`}
              aria-pressed={mark > 0}
              onClick={() => {
                updateDraft((draft) => {
                  const current = draft.state.vitalityMarks[domain.key][item] || 0;
                  const next = current === 2 ? 0 : current + 1;
                  if (next === 0) {
                    delete draft.state.vitalityMarks[domain.key][item];
                  } else {
                    draft.state.vitalityMarks[domain.key][item] = next;
                  }
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SkillRow({ skill, sheet, setSkill, updateDraft }) {
  const isOpen = sheet.state.openSpecialization === skill.key;
  return (
    <div className="skill-block">
      <div className="skill-row">
        <button
          className="row-label"
          type="button"
          onClick={() => {
            updateDraft((draft) => {
              draft.state.openSpecialization = draft.state.openSpecialization === skill.key ? null : skill.key;
            });
          }}
        >
          {skill.label}
        </button>
        <DotTrack max={SKILL_MAX} value={sheet.state.skills[skill.key]} label={skill.label} onSelect={(value) => setSkill(skill.key, value)} />
      </div>
      {isOpen && (
        <label className="specialization-field">
          <span>Especialização</span>
          <input
            value={sheet.state.specializations[skill.key] || ""}
            placeholder="Digite a especialização"
            onChange={(event) => {
              updateDraft((draft) => {
                draft.state.specializations[skill.key] = event.target.value;
              });
            }}
          />
        </label>
      )}
    </div>
  );
}

function Traits({ sheet, updateDraft }) {
  return (
    <section className="traits-panel" aria-labelledby="traits-title">
      <h2 id="traits-title">Traços</h2>
      <div className="trait-columns">
        <TraitList type="required" traits={sheet.state.traits.required} updateDraft={updateDraft} />
        <TraitList type="bought" traits={sheet.state.traits.bought} updateDraft={updateDraft} />
      </div>
    </section>
  );
}

function TraitList({ type, traits, updateDraft }) {
  return (
    <div aria-label="Traços">
      <div className="trait-list">
        {traits.map((trait, index) => (
          <div className="trait-card" key={`${type}-${index}`}>
            <span className="trait-index">{index + 1}</span>
            <input
              value={trait.name}
              placeholder="Nome do traço"
              onChange={(event) => {
                updateDraft((draft) => {
                  draft.state.traits[type][index].name = event.target.value;
                });
              }}
            />
            <button className="small-button remove-button" type="button" aria-label="Remover traço" onClick={() => removeListItem(updateDraft, ["state", "traits", type], index, { name: "", description: "" })}>
              x
            </button>
            <textarea
              value={trait.description}
              placeholder="Descrição do traço"
              onChange={(event) => {
                updateDraft((draft) => {
                  draft.state.traits[type][index].description = event.target.value;
                });
              }}
            />
          </div>
        ))}
      </div>
      <button className="add-button" type="button" onClick={() => addListItem(updateDraft, ["state", "traits", type], { name: "", description: "" })}>
        + Traço
      </button>
    </div>
  );
}

function ProgressPanel({ sheet, setField, updateDraft }) {
  const rest = Math.max((Number(sheet.fields.xpTotal) || 0) - (Number(sheet.fields.xpSpent) || 0), 0);
  return (
    <section className="progress-panel" aria-labelledby="progress-title">
      <h2 id="progress-title">Progressão</h2>
      <label className="conflict-field">
        <span>Conflito</span>
        <input value={sheet.fields.conflict} onChange={(event) => setField("conflict", event.target.value)} />
      </label>
      <label className="wide-field">
        <span>Descrição</span>
        <textarea value={sheet.fields.conflictDescription} placeholder="Explique o conflito do personagem" onChange={(event) => setField("conflictDescription", event.target.value)} />
      </label>
      <div className="milestone-field">
        <span>Marcos</span>
        <div className="milestone-row" aria-label="Marcos">
          {Array.from({ length: MILESTONE_MAX }, (_, index) => index + 1).map((item) => (
            <button
              key={item}
              className={`vitality-box ${item <= sheet.state.milestones ? "is-heavy" : ""}`}
              type="button"
              aria-label={`Marco ${item}`}
              aria-pressed={item <= sheet.state.milestones}
              onClick={() => {
                updateDraft((draft) => {
                  draft.state.milestones = draft.state.milestones === item ? item - 1 : item;
                });
              }}
            />
          ))}
        </div>
      </div>
      <label className="inventory-field">
        <span>Inventário</span>
        <textarea value={sheet.fields.inventory} placeholder="Itens, equipamentos e recursos do personagem" onChange={(event) => setField("inventory", event.target.value)} />
      </label>
      <div className="xp-grid">
        <label>
          <span>Experiência total</span>
          <input type="number" min="0" value={sheet.fields.xpTotal} onChange={(event) => setField("xpTotal", event.target.value)} />
        </label>
        <label>
          <span>Experiência gasta</span>
          <input type="number" min="0" value={sheet.fields.xpSpent} onChange={(event) => setField("xpSpent", event.target.value)} />
        </label>
        <label>
          <span>Experiência restante</span>
          <input type="number" value={rest} readOnly />
        </label>
      </div>
    </section>
  );
}

function Manifestations({ sheet, updateDraft }) {
  return (
    <section className="manifestation-grid" aria-label="Manifestações">
      {manifestationTypes.map((manifestation) => {
        const powers = sheet.state.manifestations[manifestation.key] || [{ name: "", description: "", open: false }];
        return (
          <article className="manifestation-card" key={manifestation.key}>
            <div className="manifestation-head">
              <h3>{manifestation.title}</h3>
              <strong>{manifestation.cost}</strong>
            </div>
            {powers.map((power, index) => (
              <PowerCard key={`${manifestation.key}-${index}`} manifestationKey={manifestation.key} power={power} index={index} updateDraft={updateDraft} />
            ))}
            <button className="add-button" type="button" onClick={() => addListItem(updateDraft, ["state", "manifestations", manifestation.key], { name: "", description: "", open: true })}>
              + Poder
            </button>
          </article>
        );
      })}
    </section>
  );
}

function PowerCard({ manifestationKey, power, index, updateDraft }) {
  return (
    <div className="power-card">
      <div className="power-line">
        <input
          value={power.name}
          placeholder="Nome do poder"
          onChange={(event) => {
            updateDraft((draft) => {
              ensureManifestation(draft, manifestationKey);
              draft.state.manifestations[manifestationKey][index].name = event.target.value;
            });
          }}
        />
        <button
          className="small-button"
          type="button"
          aria-label="Abrir descrição"
          onClick={() => {
            updateDraft((draft) => {
              ensureManifestation(draft, manifestationKey);
              draft.state.manifestations[manifestationKey][index].open = !draft.state.manifestations[manifestationKey][index].open;
            });
          }}
        >
          {power.open ? "-" : "+"}
        </button>
        <button className="small-button remove-button" type="button" aria-label="Remover poder" onClick={() => removeListItem(updateDraft, ["state", "manifestations", manifestationKey], index, { name: "", description: "", open: false })}>
          x
        </button>
      </div>
      {power.open && (
        <textarea
          value={power.description}
          placeholder="Descrição do poder"
          onChange={(event) => {
            updateDraft((draft) => {
              ensureManifestation(draft, manifestationKey);
              draft.state.manifestations[manifestationKey][index].description = event.target.value;
            });
          }}
        />
      )}
    </div>
  );
}

function ensureManifestation(draft, key) {
  if (!draft.state.manifestations[key]) {
    draft.state.manifestations[key] = [{ name: "", description: "", open: false }];
  }
}

function getList(root, path) {
  const last = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, root);

  if (!Array.isArray(parent[last])) {
    parent[last] = [];
  }

  return parent[last];
}

function addListItem(updateDraft, path, item) {
  updateDraft((draft) => {
    const list = getList(draft, path);
    list.push(clone(item));
  });
}

function removeListItem(updateDraft, path, index, fallback) {
  updateDraft((draft) => {
    const list = getList(draft, path);
    list.splice(index, 1);
    if (list.length === 0) {
      list.push(clone(fallback));
    }
  });
}

function AuthPanel({ user, sheet, setSheet, setStatus }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sheetList, setSheetList] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState("");
  const [activeOwnerId, setActiveOwnerId] = useState("");
  const [activeOwnerEmail, setActiveOwnerEmail] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [masterSheetList, setMasterSheetList] = useState([]);

  const refreshSheetList = async () => {
    if (!db || !user) {
      setSheetList([]);
      return;
    }

    const snapshot = await getDocs(collection(db, "users", user.uid, "sheets"));
    const sheets = snapshot.docs
      .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          title: data.fields?.characterName || "Ficha sem nome",
          savedAt: data.savedAt || "",
        };
      })
      .sort((first, second) => first.title.localeCompare(second.title, "pt-BR"));

    setSheetList(sheets);
  };

  const refreshMasterSheetList = async () => {
    if (!db || !user || !isMaster) {
      setMasterSheetList([]);
      return;
    }

    try {
      const snapshot = await getDocs(collectionGroup(db, "sheets"));
      const sheets = snapshot.docs
        .map((item) => {
          const data = item.data();
          const ownerId = item.ref.parent.parent?.id || data.ownerId || "";
        return {
          id: item.id,
          ownerId,
          ownerEmail: data.ownerEmail || ownerId,
          title: data.fields?.characterName || "Ficha sem nome",
          savedAt: data.savedAt || "",
        };
      })
      .filter((item) => item.ownerId !== user.uid)
      .sort((first, second) => {
          const ownerOrder = first.ownerEmail.localeCompare(second.ownerEmail, "pt-BR");
          return ownerOrder || first.title.localeCompare(second.title, "pt-BR");
        });

      setMasterSheetList(sheets);
      setStatus(sheets.length ? `${sheets.length} ficha(s) encontradas.` : "Nenhuma ficha salva na nuvem ainda.");
    } catch (error) {
      setMasterSheetList([]);
      setStatus("Sem permissão para listar fichas. Atualize as regras do Firestore.");
    }
  };

  useEffect(() => {
    refreshSheetList();
  }, [user]);

  useEffect(() => {
    if (!db || !user) {
      setIsMaster(false);
      setMasterSheetList([]);
      return;
    }

    getDoc(doc(db, "masters", user.uid))
      .then((snapshot) => setIsMaster(snapshot.exists()))
      .catch(() => setIsMaster(false));
  }, [user]);

  useEffect(() => {
    refreshMasterSheetList();
  }, [isMaster, user]);

  const submit = async (event) => {
    event.preventDefault();
    if (!auth) {
      return;
    }

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        setStatus("Conta criada.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setStatus("Login realizado.");
      }
      setPassword("");
    } catch (error) {
      setStatus(error.message || "Não foi possível entrar.");
    }
  };

  const sendResetEmail = async () => {
    if (!auth || !email) {
      setStatus("Digite o e-mail para recuperar a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("E-mail de recuperação enviado.");
    } catch (error) {
      setStatus(error.message || "Não foi possível enviar a recuperação.");
    }
  };

  const changePassword = async () => {
    if (!auth?.currentUser || !currentPassword || !newPassword) {
      setStatus("Preencha a senha atual e a nova senha.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setStatus("Senha alterada.");
    } catch (error) {
      setStatus(error.message || "Não foi possível alterar a senha.");
    }
  };

  const saveCloud = async () => {
    if (!db || !user) {
      return;
    }
    const id = activeSheetId || crypto.randomUUID();
    const ownerId = activeOwnerId || user.uid;
    const ownerEmail = activeOwnerEmail || user.email;
    await setDoc(doc(db, "users", ownerId, "sheets", id), {
      ...sheet,
      id,
      ownerId,
      ownerEmail,
      savedAt: new Date().toISOString(),
    });
    setActiveSheetId(id);
    setActiveOwnerId(ownerId);
    setActiveOwnerEmail(ownerEmail);
    await refreshSheetList();
    await refreshMasterSheetList();
    setStatus("Ficha salva na nuvem.");
  };

  const loadCloud = async (id = activeSheetId) => {
    if (!db || !user || !id) {
      return;
    }
    const snapshot = await getDoc(doc(db, "users", user.uid, "sheets", id));
    if (!snapshot.exists()) {
      setStatus("Nenhuma ficha salva na nuvem ainda.");
      return;
    }
    setSheet(normalizeSheet(snapshot.data()));
    setActiveSheetId(id);
    setActiveOwnerId(user.uid);
    setActiveOwnerEmail(user.email);
    setStatus("Ficha carregada da nuvem.");
  };

  const loadMasterSheet = async (item) => {
    if (!db || !user || !isMaster || !item?.ownerId || !item?.id) {
      return;
    }

    const snapshot = await getDoc(doc(db, "users", item.ownerId, "sheets", item.id));
    if (!snapshot.exists()) {
      setStatus("Ficha do jogador não encontrada.");
      return;
    }

    setSheet(normalizeSheet(snapshot.data()));
    setActiveSheetId(item.id);
    setActiveOwnerId(item.ownerId);
    setActiveOwnerEmail(item.ownerEmail);
    setStatus(`Ficha de ${item.ownerEmail} carregada.`);
  };

  const selectCloudSheet = (id) => {
    setActiveSheetId(id);
    if (id) {
      loadCloud(id);
    }
  };

  const createNewSheet = () => {
    setSheet(clone(emptySheet));
    setActiveSheetId("");
    setActiveOwnerId("");
    setActiveOwnerEmail("");
    setStatus("Nova ficha criada.");
  };

  const deleteCloudSheet = async () => {
    if (!db || !user || !activeSheetId) {
      return;
    }

    const ownerId = activeOwnerId || user.uid;
    await deleteDoc(doc(db, "users", ownerId, "sheets", activeSheetId));
    setActiveSheetId("");
    setActiveOwnerId("");
    setActiveOwnerEmail("");
    await refreshSheetList();
    await refreshMasterSheetList();
    setStatus("Ficha removida da nuvem.");
  };

  const shareCloudSheet = async () => {
    if (!db || !user) {
      return;
    }

    const id = activeSheetId || crypto.randomUUID();
    const sheetData = {
      ...sheet,
      id,
      ownerId: activeOwnerId || user.uid,
      ownerEmail: activeOwnerEmail || user.email,
      savedAt: new Date().toISOString(),
    };

    if (!activeSheetId) {
      await setDoc(doc(db, "users", user.uid, "sheets", id), sheetData);
      setActiveSheetId(id);
      setActiveOwnerId(user.uid);
      setActiveOwnerEmail(user.email);
      await refreshSheetList();
    }

    await setDoc(doc(db, "sharedSheets", id), {
      ownerId: user.uid,
      sheet: sheetData,
      title: sheet.fields.characterName || "Ficha sem nome",
      sharedAt: new Date().toISOString(),
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link de compartilhamento copiado.");
      return;
    }

    window.prompt("Copie o link de compartilhamento:", shareUrl);
    setStatus("Link de compartilhamento gerado.");
  };

  if (!isFirebaseConfigured) {
    return (
      <section className="auth-panel">
        <strong>Login e nuvem prontos para configurar</strong>
        <span>Crie um arquivo .env com os dados do Firebase para ativar cadastro, login e salvamento online.</span>
      </section>
    );
  }

  if (user) {
    return (
      <section className="auth-panel">
        <strong>{user.email}</strong>
        <label className="sheet-picker">
          <span>Minhas fichas</span>
          <select className="sheet-select" value={activeSheetId} onChange={(event) => selectCloudSheet(event.target.value)} aria-label="Selecionar ficha salva">
            <option value="">Nova ficha / não salva</option>
            {sheetList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="auth-actions">
          <button className="action-button" type="button" onClick={saveCloud}>
            Salvar na nuvem
          </button>
          <button className="action-button" type="button" onClick={() => loadCloud()} disabled={!activeSheetId}>
            Abrir ficha
          </button>
          <button className="action-button" type="button" onClick={createNewSheet}>
            Nova ficha
          </button>
          <button className="action-button" type="button" onClick={shareCloudSheet}>
            Compartilhar
          </button>
          <button className="action-button remove-button" type="button" onClick={deleteCloudSheet} disabled={!activeSheetId}>
            Excluir
          </button>
          <button className="action-button" type="button" onClick={() => signOut(auth)}>
            Sair
          </button>
        </div>
        <div className="password-tools">
          <strong>Senha</strong>
          <input type="password" value={currentPassword} placeholder="Senha atual" onChange={(event) => setCurrentPassword(event.target.value)} />
          <input type="password" value={newPassword} placeholder="Nova senha" minLength="6" onChange={(event) => setNewPassword(event.target.value)} />
          <button className="action-button" type="button" onClick={changePassword}>
            Alterar senha
          </button>
        </div>
        {isMaster && (
          <div className="master-tools">
            <strong>Perfil de Mestre</strong>
            <label className="sheet-picker">
              <span>Fichas dos jogadores</span>
              <select
                className="sheet-select master-select"
                value={activeOwnerId && activeSheetId ? `${activeOwnerId}/${activeSheetId}` : ""}
                onChange={(event) => {
                  const selected = masterSheetList.find((item) => `${item.ownerId}/${item.id}` === event.target.value);
                  if (selected) {
                    loadMasterSheet(selected);
                  }
                }}
                aria-label="Selecionar ficha de jogador"
              >
                <option value="">Selecione uma ficha</option>
                {masterSheetList.map((item) => (
                  <option key={`${item.ownerId}/${item.id}`} value={`${item.ownerId}/${item.id}`}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <button className="action-button" type="button" onClick={refreshMasterSheetList}>
              Atualizar lista
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <form className="auth-panel auth-form" onSubmit={submit}>
      <strong>{mode === "signup" ? "Criar conta" : "Entrar"}</strong>
      <input type="email" value={email} placeholder="E-mail" onChange={(event) => setEmail(event.target.value)} required />
      <input type="password" value={password} placeholder="Senha" minLength="6" onChange={(event) => setPassword(event.target.value)} required />
      <div className="auth-actions">
        <button className="action-button" type="submit">
          {mode === "signup" ? "Cadastrar" : "Entrar"}
        </button>
        <button className="action-button" type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Já tenho conta" : "Criar conta"}
        </button>
        <button className="action-button" type="button" onClick={sendResetEmail}>
          Recuperar senha
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [sheet, setSheet] = useState(loadInitialSheet);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");

  const xpRest = useMemo(() => Math.max((Number(sheet.fields.xpTotal) || 0) - (Number(sheet.fields.xpSpent) || 0), 0), [sheet.fields.xpTotal, sheet.fields.xpSpent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...sheet, savedAt: new Date().toISOString() }));
  }, [sheet]);

  useEffect(() => {
    const shareId = new URLSearchParams(window.location.search).get("share");
    if (!shareId || !db) {
      return;
    }

    getDoc(doc(db, "sharedSheets", shareId))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setStatus("Link de compartilhamento não encontrado.");
          return;
        }

        setSheet(normalizeSheet(snapshot.data().sheet));
        setStatus("Ficha compartilhada carregada.");
      })
      .catch(() => {
        setStatus("Não foi possível abrir o link compartilhado.");
      });
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  const updateDraft = (mutator) => {
    setSheet((current) => {
      const draft = clone(current);
      mutator(draft);
      return normalizeSheet(draft);
    });
  };

  const setField = (field, value) => {
    updateDraft((draft) => {
      draft.fields[field] = value;
    });
  };

  const downloadSheet = () => {
    const data = JSON.stringify({ ...sheet, savedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = safeFileName(sheet.fields.characterName);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const loadSheetFile = (file) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        setSheet(normalizeSheet(JSON.parse(reader.result)));
        setStatus("Ficha carregada.");
      } catch {
        setStatus("Arquivo inválido.");
      }
    });
    reader.readAsText(file);
  };

  return (
    <main className="sheet-shell" aria-label="Ficha de personagem Pranarquia">
      <section className="sheet page page-main">
        <BrandHeader />
        <div className="sheet-actions" aria-label="Ações da ficha">
          <button className="action-button" type="button" onClick={downloadSheet}>
            Baixar ficha
          </button>
          <label className="action-button file-action">
            Carregar ficha
            <input type="file" accept="application/json,.json" onChange={(event) => event.target.files[0] && loadSheetFile(event.target.files[0])} />
          </label>
          {status && (
            <span className="save-status" aria-live="polite">
              {status}
            </span>
          )}
        </div>
        <AuthPanel user={user} sheet={sheet} setSheet={setSheet} setStatus={setStatus} />

        <section className="top-grid" aria-label="Identidade e trilhas centrais">
          <IdentityBlock fields={sheet.fields} setField={setField} />
          <RuneBox sheet={sheet} updateDraft={updateDraft} />
          <div className="track-stack">
            <section className="compact-panel" aria-labelledby="balance-title">
              <h2 id="balance-title">Balança</h2>
              <BalanceTrack value={sheet.state.balance} updateDraft={updateDraft} />
              <div className="track-caption">Equilíbrio</div>
            </section>
            <section className="compact-panel" aria-labelledby="prana-title">
              <h2 id="prana-title">Prana</h2>
              <PranaTrack available={sheet.state.prana.available} updateDraft={updateDraft} />
            </section>
          </div>
        </section>

        <SectionRuler>Atributos, Vitalidades & Perícias</SectionRuler>
        <section className="domains-grid" aria-label="Atributos, vitalidades e perícias">
          {domains.map((domain) => (
            <DomainColumn key={domain.key} domain={domain} sheet={sheet} updateDraft={updateDraft} />
          ))}
        </section>

        <SectionRuler>Progressão e Traços</SectionRuler>
        <section className="lower-grid" aria-label="Traços e progressão">
          <Traits sheet={sheet} updateDraft={updateDraft} />
          <ProgressPanel sheet={{ ...sheet, xpRest }} setField={setField} updateDraft={updateDraft} />
        </section>
      </section>

      <section className="sheet page page-manifestations" aria-label="Manifestações prânicas">
        <BrandHeader />
        <SectionRuler>Manifestações Prânicas</SectionRuler>
        <div className="type-row">
          <label>
            <input type="checkbox" checked={sheet.fields.typeDaemoi} onChange={(event) => setField("typeDaemoi", event.target.checked)} /> Daemoi
          </label>
          <label>
            <input type="checkbox" checked={sheet.fields.typeCaalesi} onChange={(event) => setField("typeCaalesi", event.target.checked)} /> Caalesi
          </label>
          <label>
            <input type="checkbox" checked={sheet.fields.typeTenebri} onChange={(event) => setField("typeTenebri", event.target.checked)} /> Tenebri
          </label>
        </div>
        <Manifestations sheet={sheet} updateDraft={updateDraft} />
      </section>
    </main>
  );
}
