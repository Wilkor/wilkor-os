# Ruby on Rails 8 Expert Scaffold (Fullstack Expert)

A estrutura definitiva para desenvolvimento rápido e robusto seguindo a doutrina Rails.

## 📁 Estrutura de Pastas (Rails Standard)

```text
/app
  /controllers     # Camada de controle
  /models          # Lógica de negócio e banco de dados
  /views           # Templates HTML (Hotwire/Turbo)
  /javascript      # JS Moderno (Stimulus/Importmaps)
  /assets          # CSS e imagens
/config            # Configuração das rotas e apps
/db                # Migrations e schemas
/test              # Suíte de testes (Minitest)
Gemfile            # Dependências Ruby
```

## 🛠️ Comandos de Inicialização

1. **Instalação**: `gem install rails`
2. **Criação**: `rails new project-name --database=postgresql --css=tailwind`
3. **Execução**: `bin/dev` (ou `rails s`)

## 📄 Boilerplate: app/controllers/api/v1/base_controller.rb

```ruby
module Api
  module V1
    class BaseController < ApplicationController
      # Ignora CSRF para APIs JSON
      protect_from_raw_post if: -> { request.format.json? }
      
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      
      private
      
      def not_found
        render json: { error: "Resource not found" }, status: :not_found
      end
    end
  end
end
```

## 📄 Boilerplate: config/routes.rb (Modern API)

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :users, only: [:index, :show, :create]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
  root "pages#home"
end
```
