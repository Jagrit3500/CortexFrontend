import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Target, GraduationCap, Briefcase, Rocket, CheckCircle2, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './Onboarding.css'

const goals = [
  { icon: Target,        id: 'language', title: 'Master a Programming Language', desc: 'Learn Python, JavaScript, or any language end-to-end' },
  { icon: GraduationCap, id: 'exam',     title: 'Ace My University Exams',        desc: 'Structured prep aligned with your syllabus' },
  { icon: Briefcase,     id: 'career',   title: 'Transition to a Tech Career',    desc: 'Job-ready skills with portfolio projects' },
  { icon: Rocket,        id: 'project',  title: 'Build a Personal Project',       desc: 'Learn what you need to ship something real' },
]

const proficiencies  = ['Complete Beginner', 'Some Basics', 'Intermediate', 'Advanced']
const learningStyles = ['Visual (diagrams & charts)', 'Reading (text & docs)', 'Hands-on (coding & practice)', 'Video-based (watching & following)']
const timeOptions    = ['15-30 min/day', '30-60 min/day', '1-2 hours/day', '2+ hours/day']
const motivations    = ['Get a job / promotion', 'Build a personal project', 'Academic requirement', 'Pure curiosity & passion']

const STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Style' },
  { id: 4, label: 'Schedule' },
  { id: 5, label: 'Ready' },
]

export default function Onboarding() {
  const navigate   = useNavigate()
  const { setProfile } = useApp()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', subject: '', goal: '',
    proficiency: '', style: '', time: '', motivation: '',
  })

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const canProceed = () => {
    if (step === 1) return form.name.trim() && form.subject.trim()
    if (step === 2) return !!form.goal
    if (step === 3) return form.style && form.proficiency
    if (step === 4) return form.time && form.motivation
    return true
  }

  const next = () => {
    if (step < 5) return setStep(s => s + 1)
    // Save to global context so every other page knows who the learner is
    setProfile({ ...form, createdAt: new Date().toISOString() })
    navigate('/assessment')
  }

  const back = () => step > 1 ? setStep(s => s - 1) : navigate('/')

  return (
    <div className="onboarding">
      <div className="onboarding-glow" />

      {/* Logo */}
      <div className="onboarding-logo" onClick={() => navigate('/')}>
        <div className="sidebar-logo-icon"><Zap size={14} /></div>
        <span style={{ fontWeight: 700 }}>Cortex</span>
      </div>

      {/* Step indicators */}
      <div className="step-indicators">
        {STEPS.map((s, i) => (
          <>
            <div key={s.id} className="step-indicator-item">
              <div className={`step-circle ${step > s.id ? 'done' : step === s.id ? 'active' : ''}`}>
                {step > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span className={`step-indicator-label ${step === s.id ? 'active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div key={`conn-${s.id}`} className={`step-connector ${step > s.id ? 'done' : ''}`} />
            )}
          </>
        ))}
      </div>

      {/* Card */}
      <div className="onboarding-card card animate-fade-in-up">

        {/* ── Step 1 : Profile ── */}
        {step === 1 && (
          <>
            <div className="section-label text-primary">STEP 1 OF 5</div>
            <h2 className="onboarding-title">Tell us about yourself</h2>
            <p className="onboarding-sub">We'll use this to personalise your experience.</p>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="input" placeholder="e.g. Arjun Singh"
                value={form.name} onChange={e => set('name')(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">What subject do you want to learn?</label>
              <input className="input" placeholder="e.g. Python, Machine Learning, Web Dev"
                value={form.subject} onChange={e => set('subject')(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Step 2 : Goal ── */}
        {step === 2 && (
          <>
            <div className="section-label text-primary">STEP 2 OF 5</div>
            <h2 className="onboarding-title">What's Your Learning Goal?</h2>
            <p className="onboarding-sub">This helps Cortex build the perfect curriculum for you.</p>
            <div className="option-grid">
              {goals.map(({ icon: Icon, id, title, desc }) => (
                <div key={id} className={`option-card ${form.goal === id ? 'selected' : ''}`}
                  onClick={() => set('goal')(id)}>
                  <div className="option-check">{form.goal === id && <CheckCircle2 size={16} />}</div>
                  <div className="option-icon"><Icon size={22} /></div>
                  <div className="option-title">{title}</div>
                  <div className="option-desc">{desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3 : Learning Style ── */}
        {step === 3 && (
          <>
            <div className="section-label text-primary">STEP 3 OF 5</div>
            <h2 className="onboarding-title">How Do You Learn Best?</h2>
            <p className="onboarding-sub">We'll tailor the content format to your learning style.</p>
            <div className="option-list">
              {learningStyles.map(s => (
                <div key={s} className={`option-row ${form.style === s ? 'selected' : ''}`}
                  onClick={() => set('style')(s)}>
                  <div className="option-row-text">{s}</div>
                  <div className={`option-radio ${form.style === s ? 'selected' : ''}`} />
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">What's your current proficiency level?</label>
              <div className="proficiency-row">
                {proficiencies.map(p => (
                  <button key={p}
                    className={`proficiency-btn ${form.proficiency === p ? 'selected' : ''}`}
                    onClick={() => set('proficiency')(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 4 : Schedule ── */}
        {step === 4 && (
          <>
            <div className="section-label text-primary">STEP 4 OF 5</div>
            <h2 className="onboarding-title">Set Your Schedule</h2>
            <p className="onboarding-sub">Cortex will adapt lesson length to fit your time commitment.</p>
            <div className="form-group">
              <label className="form-label">How much time can you dedicate daily?</label>
              <div className="option-list">
                {timeOptions.map(t => (
                  <div key={t} className={`option-row ${form.time === t ? 'selected' : ''}`}
                    onClick={() => set('time')(t)}>
                    <div className="option-row-text">{t}</div>
                    <div className={`option-radio ${form.time === t ? 'selected' : ''}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">What's motivating you?</label>
              <div className="option-list">
                {motivations.map(m => (
                  <div key={m} className={`option-row ${form.motivation === m ? 'selected' : ''}`}
                    onClick={() => set('motivation')(m)}>
                    <div className="option-row-text">{m}</div>
                    <div className={`option-radio ${form.motivation === m ? 'selected' : ''}`} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 5 : Ready ── */}
        {step === 5 && (
          <div className="ready-screen">
            <div className="ready-icon">🚀</div>
            <h2 className="onboarding-title">You're all set, {form.name || 'Learner'}!</h2>
            <p className="onboarding-sub">
              Cortex is ready to build your personalised learning path.
              Your knowledge assessment will take about 10 minutes.
            </p>
            <div className="ready-summary">
              {form.subject     && <div className="ready-item"><span className="ready-key">Subject:</span>    <span>{form.subject}</span></div>}
              {form.goal        && <div className="ready-item"><span className="ready-key">Goal:</span>       <span>{goals.find(g => g.id === form.goal)?.title}</span></div>}
              {form.proficiency && <div className="ready-item"><span className="ready-key">Level:</span>      <span>{form.proficiency}</span></div>}
              {form.style       && <div className="ready-item"><span className="ready-key">Style:</span>      <span>{form.style}</span></div>}
              {form.time        && <div className="ready-item"><span className="ready-key">Daily Time:</span> <span>{form.time}</span></div>}
              {form.motivation  && <div className="ready-item"><span className="ready-key">Motivation:</span><span>{form.motivation}</span></div>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-nav">
          <button className="btn btn-ghost" onClick={back}><ArrowLeft size={16} /> Back</button>
          <div className="step-dots">
            {STEPS.map(s => (
              <div key={s.id} className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`} />
            ))}
          </div>
          <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
            {step === 5 ? 'Start Assessment' : 'Continue'} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <p className="onboarding-hint mono">All fields can be updated anytime in your profile settings.</p>
    </div>
  )
}
