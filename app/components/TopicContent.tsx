
"use client";

type TopicContentProps = {
  topic: string;
};

const importantQuestions = [
  {
    question: "What is an analog signal? Explain with a diagram.",
    answer:
      "An analog signal is a continuous-time signal whose amplitude can take any value within a specified range. For example, the voltage produced by a microphone changes continuously with sound pressure. An analog signal is commonly represented by a smooth waveform.",
  },
  {
    question: "What is a digital signal? Explain its characteristics.",
    answer:
      "A digital signal represents information using discrete amplitude levels. In binary digital electronics, the two logic levels are commonly represented by 0 and 1. Digital signals are convenient for logic circuits, storage and processing. Actual voltage ranges depend on the hardware logic family.",
  },
  {
    question: "Differentiate between analog and digital signals.",
    answer:
      "Analog signals have continuous amplitude values, whereas digital signals use discrete amplitude levels. Analog systems can be more directly affected by noise; digital systems can often regenerate logic levels and use error detection. Digital systems may require sampling and quantization when converting real-world analog signals.",
  },
  {
    question: "Why are digital signals widely used in computers?",
    answer:
      "Digital circuits use defined logic levels, making binary information suitable for reliable storage, processing and transmission. Digital information can be copied and processed using logic gates, and error-detection techniques can improve reliability.",
  },
  {
    question: "Explain the process of converting an analog signal into a digital signal.",
    answer:
      "The basic process includes sampling, quantization and encoding. Sampling measures the analog signal at discrete time instants. Quantization maps each sample to an allowed amplitude level. Encoding represents the quantized levels as a binary code. In practical systems, an anti-aliasing filter is often used before sampling.",
  },
];

function SignalDiagram() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-xl border bg-white p-4">
        <h4 className="mb-2 font-bold text-slate-800">Analog signal</h4>
        <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Smooth analog sine wave">
          <line x1="25" y1="75" x2="305" y2="75" stroke="currentColor" strokeOpacity=".45" />
          <line x1="35" y1="12" x2="35" y2="137" stroke="currentColor" strokeOpacity=".45" />
          <path d="M35 75 C55 15 75 15 95 75 S135 135 155 75 S195 15 215 75 S255 135 275 75 S295 35 305 50" fill="none" stroke="#2563eb" strokeWidth="3" />
          <text x="290" y="67" fontSize="10" fill="currentColor">t</text>
          <text x="8" y="15" fontSize="10" fill="currentColor">A</text>
        </svg>
        <p className="mt-2 text-sm text-slate-600">
          Amplitude varies smoothly and can take continuous values.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h4 className="mb-2 font-bold text-slate-800">Digital signal</h4>
        <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="Digital signal switching between low and high levels">
          <line x1="25" y1="115" x2="305" y2="115" stroke="currentColor" strokeOpacity=".45" />
          <line x1="35" y1="12" x2="35" y2="137" stroke="currentColor" strokeOpacity=".45" />
          <path d="M35 115 H75 V35 H115 V115 H155 V35 H215 V115 H255 V35 H295 V115 H305" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinejoin="round" />
          <text x="10" y="39" fontSize="10" fill="currentColor">1</text>
          <text x="10" y="119" fontSize="10" fill="currentColor">0</text>
          <text x="290" y="132" fontSize="10" fill="currentColor">t</text>
        </svg>
        <p className="mt-2 text-sm text-slate-600">
          Binary digital signals use defined LOW and HIGH logic levels.
        </p>
      </div>
    </div>
  );
}

export default function TopicContent({ topic }: TopicContentProps) {
  if (topic !== "Analog and digital signals") {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold">{topic}</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Detailed, topic-specific notes are being prepared for this topic.
          The completed format will include theory, relevant diagrams,
          three solved examples and important exam questions with answers.
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Do not treat this placeholder as complete exam preparation material.
        </p>
      </div>
    );
  }

  return (
    <article className="space-y-6 text-slate-800">
      <section className="rounded-2xl border bg-white p-6">
        <p className="text-sm font-bold text-indigo-600">DETAILED STUDY NOTES</p>
        <h2 className="mt-2 text-2xl font-black">Analog and Digital Signals</h2>

        <h3 className="mb-2 mt-6 text-lg font-bold">1. Introduction</h3>
        <p className="leading-7">
          A signal is a quantity that carries information. In electronics, it
          is often represented by voltage or current that changes with time.
          Signals from microphones, temperature sensors and antennas are
          commonly analog at the source. Computers and digital logic circuits,
          on the other hand, process information using discrete signal levels.
        </p>

        <h3 className="mb-2 mt-6 text-lg font-bold">2. Analog signal</h3>
        <p className="leading-7">
          An analog signal has an amplitude that can vary continuously over a
          range. For example, a sensor voltage may change from 1.21 V to
          1.22 V and then 1.221 V. A sinusoidal signal can be written as:
        </p>
        <div className="mt-3 rounded-xl bg-indigo-50 p-4 text-center font-mono text-lg">
          x(t) = A sin(2πft + φ)
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
          <li><b>A:</b> amplitude of the signal.</li>
          <li><b>f:</b> frequency in hertz (Hz).</li>
          <li><b>t:</b> time in seconds.</li>
          <li><b>φ:</b> phase angle.</li>
        </ul>

        <h3 className="mb-2 mt-6 text-lg font-bold">3. Digital signal</h3>
        <p className="leading-7">
          A digital signal uses discrete amplitude levels. In binary systems,
          these levels represent logic 0 and logic 1. For example, a digital
          controller may interpret a voltage below a specified threshold as
          LOW and a voltage above another threshold as HIGH. Exact thresholds
          depend on the device; logic 0 and 1 are not universally fixed
          voltages.
        </p>

        <h3 className="mb-2 mt-6 text-lg font-bold">4. Diagrams</h3>
        <SignalDiagram />

        <h3 className="mb-2 mt-6 text-lg font-bold">5. Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-3">Feature</th>
                <th className="border p-3">Analog</th>
                <th className="border p-3">Digital</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3">Amplitude</td>
                <td className="border p-3">Continuous range</td>
                <td className="border p-3">Discrete levels</td>
              </tr>
              <tr>
                <td className="border p-3">Example</td>
                <td className="border p-3">Microphone voltage</td>
                <td className="border p-3">Binary logic signal</td>
              </tr>
              <tr>
                <td className="border p-3">Noise handling</td>
                <td className="border p-3">Noise may change the signal value</td>
                <td className="border p-3">Logic levels can often be regenerated</td>
              </tr>
              <tr>
                <td className="border p-3">Processing</td>
                <td className="border p-3">Analog circuits</td>
                <td className="border p-3">Digital logic and processors</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-6 text-lg font-bold">6. Analog-to-digital conversion</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-50 p-4 text-center text-sm font-bold">
          <span className="rounded-lg border bg-white p-3">Analog input</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Sampling</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Quantization</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Binary encoding</span>
        </div>
        <p className="mt-3 leading-7">
          Sampling selects measurements at discrete time instants.
          Quantization maps each measured value to one of a finite number of
          allowed levels. Encoding assigns a binary code to each level.
          This process is used when a digital system must process a real-world
          analog signal.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h3 className="text-xl font-black">Three solved examples</h3>

        <div className="mt-5 space-y-5">
          <div>
            <h4 className="font-bold">Example 1: Identify the signal type</h4>
            <p className="mt-2 leading-7">
              <b>Question:</b> A temperature sensor produces a voltage that
              changes smoothly from 1.0 V to 2.5 V. Is this an analog or digital
              signal?
            </p>
            <p className="mt-2 leading-7">
              <b>Solution:</b> The voltage can take a continuous range of
              values. Therefore, it is an <b>analog signal</b>.
            </p>
          </div>

          <div>
            <h4 className="font-bold">Example 2: Calculate a sampling interval</h4>
            <p className="mt-2 leading-7">
              <b>Question:</b> A signal is sampled at 8,000 samples per second.
              Find the time interval between consecutive samples.
            </p>
            <div className="mt-2 rounded-xl bg-green-50 p-4 leading-7">
              Sampling frequency: fs = 8,000 Hz
              <br />
              Sampling interval: Ts = 1/fs
              <br />
              Ts = 1/8000 seconds = 0.000125 seconds
              <br />
              <b>Answer: Ts = 125 microseconds.</b>
            </div>
          </div>

          <div>
            <h4 className="font-bold">Example 3: Find the number of bits</h4>
            <p className="mt-2 leading-7">
              <b>Question:</b> An ideal ADC uses 8 bits. How many distinct
              binary codes are available?
            </p>
            <div className="mt-2 rounded-xl bg-green-50 p-4 leading-7">
              Number of codes = 2ⁿ
              <br />
              Here, n = 8
              <br />
              Number of codes = 2⁸ = 256
              <br />
              <b>Answer: 256 possible codes.</b>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Note: This gives the number of digital codes, not the actual
              voltage step size. That also depends on the ADC's input range
              and convention.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h3 className="text-xl font-black">Five important questions with answers</h3>
        <div className="mt-4 space-y-5">
          {importantQuestions.map((item, index) => (
            <div key={item.question} className="border-b pb-5 last:border-0">
              <h4 className="font-bold">
                Q{index + 1}. {item.question}
              </h4>
              <p className="mt-2 leading-7">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h3 className="text-xl font-black">Exam-ready long answer</h3>
        <p className="mt-3 leading-7">
          A signal carries information and may be represented as a voltage or
          current that changes with time. Analog signals have continuous
          amplitude values, whereas digital signals use discrete amplitude
          levels, commonly binary 0 and 1. Analog signals occur naturally in
          many sensing and communication applications. Digital signals are
          widely used in computers, controllers and digital communication
          systems because they can be processed and stored by logic circuits.
          The two types differ in representation, processing and noise
          handling. An analog signal can be converted into digital form using
          sampling, quantization and encoding. The choice of signal type
          depends on the application, system design and required accuracy.
          Labelled waveforms and examples should be included in an exam answer.
        </p>
      </section>

      <section className="rounded-2xl border bg-indigo-50 p-6">
        <h3 className="font-black">Quick revision</h3>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
          <li>Analog signal: continuous amplitude.</li>
          <li>Digital signal: discrete amplitude levels.</li>
          <li>Sampling interval: Ts = 1/fs.</li>
          <li>n-bit digital code: 2ⁿ possible binary codes.</li>
          <li>ADC stages: sampling, quantization and encoding.</li>
        </ul>
        <p className="mt-4 text-sm text-indigo-900">
          These are learning notes for the sample topic, not verified official
          university notes or confirmed previous-year questions.
        </p>
      </section>
    </article>
  );
}
