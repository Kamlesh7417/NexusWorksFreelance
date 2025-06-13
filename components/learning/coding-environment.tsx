'use client';

import { useState, useEffect } from 'react';
import { Play, Save, Download, Share, Terminal, Code, Zap } from 'lucide-react';

interface CodeEnvironment {
  id: string;
  name: string;
  language: string;
  template: string;
  description: string;
}

export function CodingEnvironment() {
  const [selectedEnv, setSelectedEnv] = useState<CodeEnvironment | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  const environments: CodeEnvironment[] = [
    {
      id: 'quantum-python',
      name: 'Quantum Python',
      language: 'python',
      template: `# Quantum Computing with Qiskit
from qiskit import QuantumCircuit, execute, Aer
from qiskit.visualization import plot_histogram

# Create a quantum circuit with 2 qubits
qc = QuantumCircuit(2, 2)

# Add quantum gates
qc.h(0)  # Hadamard gate on qubit 0
qc.cx(0, 1)  # CNOT gate

# Measure the qubits
qc.measure_all()

# Execute the circuit
backend = Aer.get_backend('qasm_simulator')
job = execute(qc, backend, shots=1024)
result = job.result()
counts = result.get_counts(qc)

print("Measurement results:", counts)
print("Circuit created successfully!")`,
      description: 'Build quantum circuits using Qiskit'
    },
    {
      id: 'ai-tensorflow',
      name: 'AI/ML TensorFlow',
      language: 'python',
      template: `# Neural Network with TensorFlow
import tensorflow as tf
import numpy as np

# Create a simple neural network
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# Generate sample data
X_train = np.random.random((1000, 784))
y_train = np.random.randint(10, size=(1000,))

# Train the model
history = model.fit(X_train, y_train, epochs=5, verbose=1)

print("Model trained successfully!")
print(f"Final accuracy: {history.history['accuracy'][-1]:.4f}")`,
      description: 'Build neural networks with TensorFlow'
    },
    {
      id: 'blockchain-solidity',
      name: 'Blockchain Solidity',
      language: 'solidity',
      template: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name = "NexusToken";
    string public symbol = "NXT";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**decimals;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
}`,
      description: 'Create smart contracts with Solidity'
    }
  ];

  useEffect(() => {
    if (environments.length > 0) {
      setSelectedEnv(environments[0]);
      setCode(environments[0].template);
    }
    loadSavedProjects();
  }, []);

  const loadSavedProjects = () => {
    // Mock saved projects
    setSavedProjects([
      { id: '1', name: 'Quantum Teleportation', language: 'python', lastModified: '2 hours ago' },
      { id: '2', name: 'Neural Network Classifier', language: 'python', lastModified: '1 day ago' },
      { id: '3', name: 'DeFi Token Contract', language: 'solidity', lastModified: '3 days ago' }
    ]);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    // Simulate code execution
    setTimeout(() => {
      if (selectedEnv?.language === 'python') {
        setOutput(`Running Python code...
✓ Imports successful
✓ Circuit/Model created
✓ Execution completed

Output:
${selectedEnv.id === 'quantum-python' ? 
  "Measurement results: {'00': 512, '11': 512}\nCircuit created successfully!" :
  "Model trained successfully!\nFinal accuracy: 0.9234"
}

Execution time: 2.34s
Memory usage: 45.2 MB`);
      } else if (selectedEnv?.language === 'solidity') {
        setOutput(`Compiling Solidity contract...
✓ Syntax check passed
✓ Contract compiled successfully
✓ Gas estimation: 1,234,567

Contract deployed to: 0x1234...5678
Transaction hash: 0xabcd...ef01

Deployment successful!`);
      }
      setIsRunning(false);
    }, 2000);
  };

  const saveProject = () => {
    const projectName = prompt('Enter project name:');
    if (projectName) {
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        language: selectedEnv?.language || 'python',
        code,
        lastModified: 'Just now'
      };
      setSavedProjects(prev => [newProject, ...prev]);
      alert('Project saved successfully!');
    }
  };

  const shareProject = () => {
    const shareUrl = `https://nexusworks.dev/share/${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const switchEnvironment = (env: CodeEnvironment) => {
    setSelectedEnv(env);
    setCode(env.template);
    setOutput('');
  };

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Quantum Coding Environment</h2>
          <p className="text-sm opacity-80">Interactive development environment with real-time execution</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedEnv?.id || ''}
            onChange={(e) => {
              const env = environments.find(env => env.id === e.target.value);
              if (env) switchEnvironment(env);
            }}
            className="bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white outline-none"
          >
            {environments.map(env => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Code Editor */}
        <div className="lg:col-span-3">
          <div className="bg-black rounded-lg overflow-hidden">
            {/* Editor Header */}
            <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-cyan-400" />
                <span className="text-sm font-medium">{selectedEnv?.name}</span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded">
                  {selectedEnv?.language}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={saveProject} className="text-gray-400 hover:text-white">
                  <Save size={16} />
                </button>
                <button onClick={shareProject} className="text-gray-400 hover:text-white">
                  <Share size={16} />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Code Area */}
            <div className="p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-transparent text-white font-mono text-sm resize-none outline-none"
                placeholder="Write your code here..."
                spellCheck={false}
              />
            </div>

            {/* Editor Footer */}
            <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Lines: {code.split('\n').length}</span>
                <span>Characters: {code.length}</span>
                <span>Language: {selectedEnv?.language}</span>
              </div>
              
              <button
                onClick={runCode}
                disabled={isRunning}
                className="nexus-action-btn flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Run Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Terminal */}
          <div className="mt-4 bg-black rounded-lg overflow-hidden">
            <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/10">
              <Terminal size={16} className="text-green-400" />
              <span className="text-sm font-medium">Output Terminal</span>
            </div>
            
            <div className="p-4">
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap min-h-[120px]">
                {output || 'Ready to execute code...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Environment Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-400 mb-2">Current Environment</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Language:</span>
                <span className="capitalize">{selectedEnv?.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Runtime:</span>
                <span>Quantum Simulator</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory:</span>
                <span>2GB Available</span>
              </div>
            </div>
            <p className="text-xs opacity-80 mt-3">{selectedEnv?.description}</p>
          </div>

          {/* Saved Projects */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-400 mb-3">Saved Projects</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedProjects.map(project => (
                <div key={project.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="text-xs text-gray-400 flex justify-between">
                    <span>{project.language}</span>
                    <span>{project.lastModified}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="nexus-action-btn w-full mt-3 text-sm py-1">
              View All Projects
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-cyan-400 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors text-sm">
                📚 View Documentation
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors text-sm">
                🔧 Install Packages
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors text-sm">
                🚀 Deploy to Cloud
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors text-sm">
                👥 Collaborate
              </button>
            </div>
          </div>

          {/* Quantum Status */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-purple-400" />
              <span className="font-medium text-purple-400">Quantum Runtime</span>
            </div>
            <div className="text-xs text-gray-400">
              Connected to quantum simulator with 32-qubit capacity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}